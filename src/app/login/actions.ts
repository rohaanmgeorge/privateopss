"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type CreateAccountResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates an email + password account that is confirmed immediately, so sign-up
 * doesn't depend on email delivery. The client signs in right after.
 *
 * Trade-off: the address isn't proven to belong to the person. Their data is
 * still private to whoever holds the password; switch to verified sign-up
 * (supabase.auth.signUp) once custom SMTP is configured.
 */
export async function createAccount(email: string, password: string): Promise<CreateAccountResult> {
  const address = String(email ?? "").trim().toLowerCase();
  const pass = String(password ?? "");
  if (!EMAIL.test(address) || address.length > 254) return { ok: false, error: "Enter a valid email address." };
  if (pass.length < 8 || pass.length > 72) return { ok: false, error: "Use a password of 8–72 characters." };

  const { error } = await supabaseAdmin().auth.admin.createUser({ email: address, password: pass, email_confirm: true });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return {
      ok: false,
      error: exists
        ? "An account with this email already exists. Sign in instead — if you’ve only used email links, sign in that way and set a password in Settings."
        : error.message,
    };
  }
  return { ok: true };
}
