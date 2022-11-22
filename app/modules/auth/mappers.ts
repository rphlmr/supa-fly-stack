import type { SupabaseAuthSession } from "~/integrations/supabase";

import { REFRESH_ACCESS_TOKEN_THRESHOLD } from "./const";
import type { AuthSession } from "./types";

export function mapAuthSession(
  supabaseAuthSession: SupabaseAuthSession | null
): AuthSession | null {
  if (!supabaseAuthSession) return null;

  if (!supabaseAuthSession.refresh_token)
    throw new Error("User should have a refresh token");

  if (!supabaseAuthSession.user?.email)
    throw new Error("User should have an email");

  return {
    accessToken: supabaseAuthSession.access_token,
    refreshToken: supabaseAuthSession.refresh_token,
    userId: supabaseAuthSession.user.id,
    email: supabaseAuthSession.user.email,
    // we set a threshold to force access token refresh before it expires when we use Supabase in Browser
    expiresIn:
      (supabaseAuthSession.expires_in ?? 3600) - REFRESH_ACCESS_TOKEN_THRESHOLD,
    expiresAt: supabaseAuthSession.expires_at ?? -1,
  };
}
