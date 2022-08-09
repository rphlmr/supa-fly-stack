import { supabaseAdmin } from "~/integrations/supabase/supabase.server";

export async function deleteAuthAccount(userId: string) {
  return supabaseAdmin.auth.api.deleteUser(userId);
}
