import { getSupabaseAdmin } from "~/integrations/supabase";

export async function createAuthAccount(email: string, password: string) {
  const { data, error } = await getSupabaseAdmin().auth.api.createUser({
    email,
    password,
    email_confirm: true, // demo purpose, assert that email is confirmed. For production, check email confirmation
  });

  if (!data || error) return null;

  return data;
}
