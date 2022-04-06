import { createCookieSessionStorage, redirect } from "@remix-run/node";

import type { AuthSession } from "~/database/supabase.server";
import {
  isGET,
  getCurrentPath,
  getRedirectTo,
  makeRedirectToFromHere,
} from "~/utils/request.server";
import { mapSession } from "~/utils/session-mapper";

import { getAuthByAccessToken, refreshAccessToken } from "./auth.server";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set");
}

/**
 * Default configuration
 */

const USER_SESSION_KEY = "token";
const ERROR_SESSION_KEY = "error";
const LOGIN_URL = "/login";

/**
 * What's stored in session storage cookie
 */

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  expiresIn: number;
  expiresAt: number;
}

export type RealtimeSession = Pick<
  UserSession,
  "accessToken" | "expiresIn" | "expiresAt"
>;

/**
 * Session storage CRUD
 */

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserSession(
  request: Request
): Promise<UserSession | null> {
  const session = await getSession(request);
  return session.get(USER_SESSION_KEY);
}

/**
 * Commit user session to cookie
 * Useful in actions
 * @example
  return redirect(`/notes/${note.id}`, {
    headers: {
      "Set-Cookie": await commitUserSession(request, { userSession }),
    },
  });
 *
 */
export async function commitUserSession(
  request: Request,
  {
    userSession,
    flashErrorMessage,
  }: {
    userSession?: UserSession | null;
    flashErrorMessage?: string | null;
  } = {}
) {
  const session = await getSession(request);

  // allow user session to be null.
  // useful you want to clear session and display a message explaining why
  if (userSession !== undefined) {
    session.set(USER_SESSION_KEY, userSession);
  }

  session.flash(ERROR_SESSION_KEY, flashErrorMessage);

  return sessionStorage.commitSession(session);
}

export async function createUserSession({
  request,
  authSession,
  redirectTo,
}: {
  request: Request;
  authSession: AuthSession;
  redirectTo: string;
}) {
  const userSession = mapSession(authSession);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitUserSession(request, {
        userSession,
        flashErrorMessage: null,
      }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

/**
 * User session validations
 */

async function verifyUserSession(request: Request) {
  const session = await getUserSession(request);

  if (!session?.accessToken) return false;

  const { error, user: authAccount } = await getAuthByAccessToken(
    session.accessToken
  );

  return !(error || !authAccount);
}

async function assertUserSession(
  request: Request,
  { onFailRedirectTo }: { onFailRedirectTo?: string } = {}
) {
  const userSession = await getUserSession(request);

  // If there is no user session, Fly, You Fools! 🧙‍♂️
  if (!userSession?.accessToken || !userSession?.refreshToken) {
    throw redirect(
      `${onFailRedirectTo || LOGIN_URL}?${makeRedirectToFromHere(request)}`,
      {
        headers: {
          "Set-Cookie": await commitUserSession(request, {
            userSession: null,
            flashErrorMessage: "no-user-session",
          }),
        },
      }
    );
  }

  return userSession;
}

// used in /refresh-session's loader
export async function refreshSession(request: Request): Promise<UserSession> {
  const userSession = await assertUserSession(request);

  const { refreshedSession, error } = await refreshAccessToken(
    userSession.refreshToken
  );

  // 👾 game over, log in again
  // yes, arbitrary, but it's a good way to don't let an illegal user here with an expired token
  if (!refreshedSession || error) {
    const currentPath = getCurrentPath(request);
    const redirectUrl =
      // if user access /refresh-session by typing url, don't loop
      currentPath === "/refresh-session"
        ? LOGIN_URL
        : `${LOGIN_URL}?${makeRedirectToFromHere(request)}`;

    // here we throw instead of return because this function promise a UserSession and not a response object
    // https://remix.run/docs/en/v1/guides/constraints#higher-order-functions
    throw redirect(redirectUrl, {
      headers: {
        "Set-Cookie": await commitUserSession(request, {
          userSession: null,
          flashErrorMessage: "fail-refresh-user-session",
        }),
      },
    });
  }

  const refreshedUserSession = mapSession(refreshedSession);

  // refresh is ok and we can redirect
  if (isGET(request)) {
    // here we throw instead of return because this function promise a UserSession and not a response object
    // https://remix.run/docs/en/v1/guides/constraints#higher-order-functions
    throw redirect(getRedirectTo(request), {
      headers: {
        "Set-Cookie": await commitUserSession(request, {
          userSession: refreshedUserSession,
        }),
      },
    });
  }

  // we can't redirect because we are in an action, so, deal with it and don't forget to handle session commit 👮‍♀️
  return refreshedUserSession;
}

/**
 * Assert user session is present and verified from supabase auth api
 *
 * If used in loader (GET method)
 * - Redirect to /refresh-session if session is expired
 * - Return user session if not expired
 * - Destroy session if refresh token is expired
 *
 * If used in action (POST method)
 * - Try to refresh session if expired and return this new session (it's your job to handle session commit)
 * - Return user session if not expired
 * - Destroy session if refresh token is expired
 */
export async function requireUserSession(
  request: Request,
  { onFailRedirectTo }: { onFailRedirectTo?: string } = {}
): Promise<UserSession> {
  // hello there
  const userSession = await assertUserSession(request, {
    onFailRedirectTo,
  });

  // ok, let's challenge its access token
  const isValid = await verifyUserSession(request);

  // damn, access token expires but we can redirect. Let's go!
  if (!isValid && isGET(request)) {
    throw redirect(`/refresh-session?${makeRedirectToFromHere(request)}`);
  }

  // so, maybe we are in a POST / PUT / PATCH / DELETE method
  // user session is valid, but we don't know if it'll expire in a microsecond.
  // it can be problematic if you use this access token to fetch one of your external api
  // let's refresh session in case of 🧐
  if (!isGET(request)) {
    return refreshSession(request);
  }

  // finally, we have a valid session, let's return it
  return userSession;
}
