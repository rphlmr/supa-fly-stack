import { supabaseAdmin } from "~/database/supabase.server";
import type { AuthSession } from "~/database/supabase.server";
import { createUser } from "~/models/user.server";

export async function getAuthByAccessToken(
  accessToken: AuthSession["access_token"]
) {
  return supabaseAdmin.auth.api.getUser(accessToken);
}

export async function refreshAccessToken(refreshToken: string) {
  return supabaseAdmin.auth.api
    .refreshAccessToken(refreshToken)
    .then(({ data: authSession, error }) => ({
      refreshedSession: authSession,
      error,
    }));
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.api.signInWithEmail(
    email,
    password
  );
  return { authSession: data, authSessionError: error };
}

export async function createAuthAccount(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.api.createUser({
    email,
    password,
    email_confirm: true, // demo purpose, assert that email is confirmed. For production, check email confirmation
  });

  return { authAccount: data, createAuthAccountError: error };
}

export async function _DANGEROUS_deleteAuthAccount(userId: string) {
  return supabaseAdmin.auth.api.deleteUser(userId);
}

export async function createUserAccount(
  email: string,
  password: string
): Promise<AuthSession | null> {
  const { authAccount, createAuthAccountError } = await createAuthAccount(
    email,
    password
  );

  // ok, no user account created
  if (!authAccount || createAuthAccountError) return null;

  const { authSession, authSessionError } = await signInWithEmail(
    email,
    password
  );

  // user account created but no session 😱
  // we should delete the user account to allow retry create account again
  if (!authSession || authSessionError) {
    await _DANGEROUS_deleteAuthAccount(authAccount.id);
    return null;
  }

  const { createUserError } = await createUser(authAccount);

  // user account created and have a session but unable to store in User table
  // we should delete the user account to allow retry create account again
  if (createUserError) {
    await _DANGEROUS_deleteAuthAccount(authAccount.id);
    return null;
  }

  return authSession;
}

export async function creatOAuthUser(id: string, email: string) {
  const { createUserError } = await createUser({
    id,
    email,
  });

  // user account created and have a session but unable to store in User table
  // we should delete the user account to allow retry create account again
  if (createUserError) {
    await _DANGEROUS_deleteAuthAccount(id);
    return createUserError;
  }
}

// yeah ... we can do that server-side. It's awesome
export async function sendMagicLink({
  email,
  redirectTo,
}: {
  email: string;
  redirectTo?: string;
}) {
  return supabaseAdmin.auth.api.sendMagicLinkEmail(email, {
    redirectTo: `${process.env.SERVER_URL}/oauth/callback${
      redirectTo ? `?redirectTo=${redirectTo}` : ""
    }`,
  });
}
