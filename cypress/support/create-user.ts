// Use this to create a new user and login with that user
// Simply call this with:
// npx ts-node --require tsconfig-paths/register ./cypress/support/create-user.ts username@example.com
// and it will log out the cookie value you can use to interact with the server
// as that new user.

import { installGlobals } from "@remix-run/node";
import { createAuthAccount } from "~/modules/auth/mutations";
import { db } from "~/database";

installGlobals();

async function createAccount(email: string, password: string) {
  if (!email || !password) {
    throw new Error("email and password required to create account");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  const authAccount = await createAuthAccount(email, password);

  if (!authAccount) {
    throw new Error("Failed to create user account for cypress");
  }

  const newUser = await db.user.create({
    data: {
      email: email.toLowerCase(),
      id: authAccount.id,
    },
  });

  if (!newUser) {
    throw new Error("Failed to create user database entry");
  }

  return { email, password };
}

createAccount(process.argv[2], process.argv[3]);
