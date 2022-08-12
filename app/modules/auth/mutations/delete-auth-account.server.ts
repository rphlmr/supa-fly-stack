import { getSupabaseAdmin } from "~/integrations/supabase";

export async function deleteAuthAccount(userId: string) {
  return getSupabaseAdmin().auth.api.deleteUser(userId);
}
