import { getSupabaseAdmin } from "~/integrations/supabase";
import { SERVER_URL } from "~/utils/env";

import { mapAuthSession } from "../utils/map-auth-session.server";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await getSupabaseAdmin().auth.api.signInWithEmail(
    email,
    password
  );

  if (!data || error) return null;

  return mapAuthSession(data);
}

export async function sendMagicLink(email: string) {
  return getSupabaseAdmin().auth.api.sendMagicLinkEmail(email, {
    redirectTo: `${SERVER_URL}/oauth/callback`,
  });
}
