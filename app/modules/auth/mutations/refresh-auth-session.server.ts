import { redirect } from "@remix-run/node";

import { getSupabaseAdmin } from "~/integrations/supabase";
import {
  getCurrentPath,
  isGet,
  makeRedirectToFromHere,
} from "~/utils/http.server";

import { LOGIN_URL } from "../const";
import type { AuthSession } from "../session.server";
import { getAuthSession, commitAuthSession } from "../session.server";
import { mapAuthSession } from "../utils/map-auth-session.server";

export async function refreshAccessToken(refreshToken?: string) {
  if (!refreshToken) return null;

  const { data, error } = await getSupabaseAdmin().auth.api.refreshAccessToken(
    refreshToken
  );

  if (!data || error) return null;

  return mapAuthSession(data);
}

export async function refreshAuthSession(
  request: Request
): Promise<AuthSession> {
  const authSession = await getAuthSession(request);

  const refreshedAuthSession = await refreshAccessToken(
    authSession?.refreshToken
  );

  // 👾 game over, log in again
  // yes, arbitrary, but it's a good way to don't let an illegal user here with an expired token
  if (!refreshedAuthSession) {
    const redirectUrl = `${LOGIN_URL}?${makeRedirectToFromHere(request)}`;

    // here we throw instead of return because this function promise a AuthSession and not a response object
    // https://remix.run/docs/en/v1/guides/constraints#higher-order-functions
    throw redirect(redirectUrl, {
      headers: {
        "Set-Cookie": await commitAuthSession(request, {
          authSession: null,
          flashErrorMessage: "fail-refresh-auth-session",
        }),
      },
    });
  }

  // refresh is ok and we can redirect
  if (isGet(request)) {
    // here we throw instead of return because this function promise a UserSession and not a response object
    // https://remix.run/docs/en/v1/guides/constraints#higher-order-functions
    throw redirect(getCurrentPath(request), {
      headers: {
        "Set-Cookie": await commitAuthSession(request, {
          authSession: refreshedAuthSession,
        }),
      },
    });
  }

  // we can't redirect because we are in an action, so, deal with it and don't forget to handle session commit 👮‍♀️
  return refreshedAuthSession;
}
