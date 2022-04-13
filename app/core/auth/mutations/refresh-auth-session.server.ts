import { redirect } from "@remix-run/node";

import { supabaseAdmin } from "~/core/integrations/supabase/supabase.server";
import { getCurrentPath, getRedirectTo, isGet, makeRedirectToFromHere } from "~/core/utils/http.server";

import { LOGIN_URL } from "../const";
import { assertAuthSession } from "../guards/assert-auth-session.server";
import type { AuthSession } from "../session.server";
import { commitAuthSession } from "../session.server";
import { mapAuthSession } from "../utils/map-auth-session";

async function refreshAccessToken(refreshToken: string) {
  const { data, error } = await supabaseAdmin.auth.api.refreshAccessToken(refreshToken);

  if (!data || error) return null;

  return mapAuthSession(data);
}

// used in /refresh-session's loader
export async function refreshAuthSession(request: Request): Promise<AuthSession> {
  const authSession = await assertAuthSession(request);

  const refreshedAuthSession = await refreshAccessToken(authSession.refreshToken);

  // 👾 game over, log in again
  // yes, arbitrary, but it's a good way to don't let an illegal user here with an expired token
  if (!refreshedAuthSession) {
    const currentPath = getCurrentPath(request);
    const redirectUrl =
      // if user access /refresh-session by typing url, don't loop
      currentPath === "/refresh-session" ? LOGIN_URL : `${LOGIN_URL}?${makeRedirectToFromHere(request)}`;

    // here we throw instead of return because this function promise a UserSession and not a response object
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
    throw redirect(getRedirectTo(request), {
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
