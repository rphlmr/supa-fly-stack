// Use this to delete a user by their email
// Simply call this with:
// npx ts-node --require tsconfig-paths/register ./cypress/support/delete-user.ts username@example.com
// and that user will get deleted

import { installGlobals } from "@remix-run/node/globals";
import { deleteUserByEmail, getUserByEmail } from "~/models/user.server";
import { _DANGEROUS_deleteAuthAccount } from "~/services/auth.server";

installGlobals();

async function deleteUser(email: string) {
  if (!email) {
    throw new Error("email required for login");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  const user = await getUserByEmail(email);
  await deleteUserByEmail(email);
  await _DANGEROUS_deleteAuthAccount(user?.id!);
}

deleteUser(process.argv[2]);
