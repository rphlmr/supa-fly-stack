import { getSupabaseAdmin } from "~/integrations/supabase";
import type { SupabaseAuthSession } from "~/integrations/supabase/types";

export async function getAuthAccountByAccessToken(
  accessToken: SupabaseAuthSession["access_token"]
) {
  const { data, error } = await getSupabaseAdmin().auth.api.getUser(
    accessToken
  );

  if (!data || error) return null;

  return data;
}
