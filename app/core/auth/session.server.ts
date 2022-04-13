import { createCookieSessionStorage, redirect } from "@remix-run/node";

import { SESSION_ERROR_KEY, SESSION_KEY, SESSION_MAX_AGE } from "./const";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set");
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  expiresIn: number;
  expiresAt: number;
}

export type RealtimeAuthSession = Pick<
  AuthSession,
  "accessToken" | "expiresIn" | "expiresAt"
>;

/**
 * Session storage CRUD
 */

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function createAuthSession({
  request,
  authSession,
  redirectTo,
}: {
  request: Request;
  authSession: AuthSession;
  redirectTo: string;
}) {
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitAuthSession(request, {
        authSession,
        flashErrorMessage: null,
      }),
    },
  });
}

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getAuthSession(
  request: Request
): Promise<AuthSession | null> {
  const session = await getSession(request);
  return session.get(SESSION_KEY);
}

export async function commitAuthSession(
  request: Request,
  {
    authSession,
    flashErrorMessage,
  }: {
    authSession?: AuthSession | null;
    flashErrorMessage?: string | null;
  } = {}
) {
  const session = await getSession(request);

  // allow user session to be null.
  // useful you want to clear session and display a message explaining why
  if (authSession !== undefined) {
    session.set(SESSION_KEY, authSession);
  }

  session.flash(SESSION_ERROR_KEY, flashErrorMessage);

  return sessionStorage.commitSession(session, { maxAge: SESSION_MAX_AGE });
}

export async function destroyAuthSession(request: Request) {
  const session = await getSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
