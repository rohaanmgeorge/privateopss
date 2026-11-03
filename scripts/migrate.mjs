// Applies supabase/migrations/*.sql in order, tracking what has run.
// Usage: npm run db:migrate   (reads POSTGRES_URL_NON_POOLING from .env.local)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

process.loadEnvFile?.(".env.local");

const raw = process.env.POSTGRES_URL_NON_POOLING;
if (!raw) {
  console.error("POSTGRES_URL_NON_POOLING is not set. Run `vercel env pull` first.");
  process.exit(1);
}

// Supabase uses TLS; strip sslmode from the URL so the explicit ssl option below applies.
const url = new URL(raw);
url.searchParams.delete("sslmode");
url.searchParams.delete("supa");

const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const dir = path.join(process.cwd(), "supabase", "migrations");

await client.connect();
try {
  await client.query(`create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())`);
  await client.query(`alter table public._migrations enable row level security`);
  const done = new Set((await client.query("select name from public._migrations")).rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (done.has(file)) {
      console.log(`· ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(path.join(dir, file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public._migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`✓ ${file}`);
    } catch (err) {
      await client.query("rollback");
      throw new Error(`${file}: ${err.message}`);
    }
  }
} finally {
  await client.end();
}
