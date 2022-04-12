import { supabaseAdmin } from "~/core/integrations/supabase/supabase.server";
import type { SupabaseError } from "~/core/integrations/supabase/types";

import type { AuthSession } from "../session.server";
import { mapAuthSession } from "../utils/map-auth-session";

export async function signInWithEmail(
  email: string,
  password: string
): Promise<[AuthSession | null, SupabaseError | null]> {
  const { data, error } = await supabaseAdmin.auth.api.signInWithEmail(email, password);

  return [mapAuthSession(data), error];
}

export async function sendMagicLink({ email, redirectTo }: { email: string; redirectTo?: string }) {
  return supabaseAdmin.auth.api.sendMagicLinkEmail(email, {
    redirectTo: `${process.env.SERVER_URL}/oauth/callback${redirectTo ? `?redirectTo=${redirectTo}` : ""}`,
  });
}
