import { redirect } from "@remix-run/node";

import { isGet, makeRedirectToFromHere } from "~/core/utils/http.server";

import { refreshAuthSession } from "../mutations/refresh-auth-session.server";
import { getAuthAccountByAccessToken } from "../queries/get-auth-account.server";
import type { AuthSession } from "../session.server";
import { assertAuthSession } from "./assert-auth-session.server";

async function verifyAuthSession(authSession: AuthSession) {
  const authAccount = await getAuthAccountByAccessToken(authSession.accessToken);

  return Boolean(authAccount);
}

/**
 * Assert auth session is present and verified from supabase auth api
 *
 * If used in loader (GET method)
 * - Redirect to /refresh-session if session is expired
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

  // damn, access token expires but we can redirect. Let's go!
  if (!isValidSession && isGet(request)) {
    throw redirect(`/refresh-session?${makeRedirectToFromHere(request)}`);
  }

  // so, maybe we are in a POST / PUT / PATCH / DELETE method
  // user session is valid, but we don't know if it'll expire in a microsecond.
  // it can be problematic if you use this access token to fetch one of your external api
  // let's refresh session in case of 🧐
  if (!isGet(request)) {
    return refreshAuthSession(request);
  }

  // finally, we have a valid session, let's return it
  return authSession;
}
