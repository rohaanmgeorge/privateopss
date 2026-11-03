-- Private OS · Budget module
-- Every row belongs to exactly one auth user; RLS restricts all access to the owner.

create table if not exists public.budget_settings (
  user_id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  currency        text not null default 'INR' check (char_length(currency) = 3),
  locale          text not null default 'en-IN',
  cycle_start_day smallint not null default 1 check (cycle_start_day between 1 and 28),
  updated_at      timestamptz not null default now()
);

create table if not exists public.categories (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id            text not null check (char_length(id) between 1 and 64),
  name          text not null check (char_length(name) between 1 and 40),
  glyph         text not null default '◆',
  color         text not null default 'var(--chart-1)',
  kind          text not null check (kind in ('expense', 'income')),
  monthly_limit bigint not null default 0 check (monthly_limit >= 0),
  fixed         boolean not null default false,
  created_at    timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('expense', 'income')),
  amount      bigint not null check (amount > 0),
  category_id text not null,
  note        text not null default '' check (char_length(note) <= 200),
  date        date not null,
  created_at  timestamptz not null default now(),
  foreign key (user_id, category_id) references public.categories (user_id, id) on delete restrict
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc, created_at desc);

alter table public.budget_settings enable row level security;
alter table public.categories      enable row level security;
alter table public.transactions    enable row level security;

-- Owner-only policies. `(select auth.uid())` is evaluated once per query, not per row.
do $$
declare t text;
begin
  foreach t in array array['budget_settings', 'categories', 'transactions'] loop
    execute format('drop policy if exists "owner can read" on public.%I', t);
    execute format('drop policy if exists "owner can insert" on public.%I', t);
    execute format('drop policy if exists "owner can update" on public.%I', t);
    execute format('drop policy if exists "owner can delete" on public.%I', t);
    execute format('create policy "owner can read" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "owner can insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "owner can update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "owner can delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Anonymous visitors get nothing.
revoke all on public.budget_settings, public.categories, public.transactions from anon;
grant select, insert, update, delete on public.budget_settings, public.categories, public.transactions to authenticated;
