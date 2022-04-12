import { createAuthAccount, deleteAuthAccount, signInWithEmail } from "~/core/auth/mutations";
import type { AuthSession } from "~/core/auth/session.server";
import type { User } from "~/core/database/db.server";
import { db } from "~/core/database/db.server";

async function createUser({
  email,
  userId,
}: Pick<AuthSession, "userId" | "email">): Promise<[User | null, unknown | null]> {
  try {
    const user = await db.user.create({
      data: {
        email,
        id: userId,
      },
    });
    return [user, null];
  } catch (e) {
    return [null, e];
  }
}

export async function createUserAccountByEmailPassword(email: string, password: string): Promise<AuthSession | null> {
  const [authAccount, createAuthAccountError] = await createAuthAccount(email, password);

  // ok, no user account created
  if (!authAccount || createAuthAccountError) return null;

  const [authSession, authSessionError] = await signInWithEmail(email, password);

  // user account created but no session 😱
  // we should delete the user account to allow retry create account again
  if (!authSession || authSessionError) {
    await deleteAuthAccount(authAccount.id);
    return null;
  }

  const [user, createUserError] = await createUser(authSession);

  // user account created and have a session but unable to store in User table
  // we should delete the user account to allow retry create account again
  if (!user || createUserError) {
    await deleteAuthAccount(authAccount.id);
    return null;
  }

  return authSession;
}

export async function createUserAccountFromOAuth(userId: string, email: string) {
  const [user, createUserError] = await createUser({
    userId,
    email,
  });

  // user account created and have a session but unable to store in User table
  // we should delete the user account to allow retry create account again
  if (!user || createUserError) {
    await deleteAuthAccount(userId);
    return createUserError;
  }
}
