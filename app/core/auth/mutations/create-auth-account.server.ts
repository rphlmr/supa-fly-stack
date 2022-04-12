import { supabaseAdmin } from "~/core/integrations/supabase/supabase.server";
import type { SupabaseError, SupabaseUser } from "~/core/integrations/supabase/types";

export async function createAuthAccount(
  email: string,
  password: string
): Promise<[SupabaseUser | null, SupabaseError | null]> {
  const { data, error } = await supabaseAdmin.auth.api.createUser({
    email,
    password,
    email_confirm: true, // demo purpose, assert that email is confirmed. For production, check email confirmation
  });

  return [data, error];
}
