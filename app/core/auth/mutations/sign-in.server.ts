import { supabaseAdmin } from "~/core/integrations/supabase/supabase.server";

import { mapAuthSession } from "../utils/map-auth-session";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.api.signInWithEmail(email, password);

  if (!data || error) return null;

  return mapAuthSession(data);
}

export async function sendMagicLink({ email, redirectTo }: { email: string; redirectTo?: string }) {
  return supabaseAdmin.auth.api.sendMagicLinkEmail(email, {
    redirectTo: `${process.env.SERVER_URL}/oauth/callback${redirectTo ? `?redirectTo=${redirectTo}` : ""}`,
  });
}
