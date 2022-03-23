import { AuthSession } from "~/database/supabase.server";
import { UserSession } from "~/services/session.server";

export function mapSession(authSession: AuthSession): UserSession {
  return {
    accessToken: authSession.access_token,
    refreshToken: authSession.refresh_token ?? "",
    userId: authSession.user?.id ?? "",
    email: authSession.user?.email ?? "",
  };
}
