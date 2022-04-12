import { supabaseAdmin } from "~/core/integrations/supabase/supabase.server";
import type { SupabaseAuthSession, SupabaseError, SupabaseUser } from "~/core/integrations/supabase/types";

export async function getAuthAccountByAccessToken(
  accessToken: SupabaseAuthSession["access_token"]
): Promise<[SupabaseUser | null, SupabaseError | null]> {
  const { data, error } = await supabaseAdmin.auth.api.getUser(accessToken);

  return [data, error];
}
