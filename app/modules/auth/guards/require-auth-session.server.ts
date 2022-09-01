import { REFRESH_THRESHOLD } from "../const";
import { refreshAuthSession } from "../mutations/refresh-auth-session.server";
import { getAuthAccountByAccessToken } from "../queries/get-auth-account.server";
import type { AuthSession } from "../session.server";
import { assertAuthSession } from "./assert-auth-session.server";

async function verifyAuthSession(authSession: AuthSession) {
  const authAccount = await getAuthAccountByAccessToken(
    authSession.accessToken
  );

  if (!authAccount) return false;

  // Here we verify that what we have in the session is the same as what we have in the auth database.
  // It's a guard against a session cookie secret leak.
  if (authAccount.id !== authSession.userId) {
    return false;
  }

  return true;
}

function isExpiringSoon(expiresAt: number) {
  return (expiresAt - REFRESH_THRESHOLD) * 1000 < Date.now();
}

/**
 * Assert auth session is present and verified from supabase auth api
 *
 * If used in loader (GET method)
 * - Refresh tokens if session is expired
 * - Return auth session if not expired
 * - Destroy session if refresh token is expired
 *
 * If used in action (POST method)
 * - Try to refresh session if expired and return this new session (it's your job to handle session commit)
 * - Return auth session if not expired
 * - Destroy session if refresh token is expired
 */
export async function requireAuthSession(
  request: Request,
  { onFailRedirectTo }: { onFailRedirectTo?: string } = {}
): Promise<AuthSession> {
  // hello there
  const authSession = await assertAuthSession(request, {
    onFailRedirectTo,
  });

  // ok, let's challenge its access token
  const isValidSession = await verifyAuthSession(authSession);

  // damn, access token is not valid or expires soon
  // let's try to refresh, in case of 🧐
  if (!isValidSession || isExpiringSoon(authSession.expiresAt)) {
    return refreshAuthSession(request);
  }

  // finally, we have a valid session, let's return it
  return authSession;
}
