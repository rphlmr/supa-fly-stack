import type { AuthSession } from "~/database/supabase.server";
import type { UserSession } from "~/services/session.server";

export function mapSession(authSession: AuthSession): UserSession {
  return {
    accessToken: authSession.access_token,
    refreshToken: authSession.refresh_token ?? "",
    userId: authSession.user?.id ?? "",
    email: authSession.user?.email ?? "",
    expiresIn: authSession.expires_in ?? -1,
    expiresAt: authSession.expires_at ?? -1,
  };
}
