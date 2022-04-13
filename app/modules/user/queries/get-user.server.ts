import type { User } from "~/core/database/db.server";
import { db } from "~/core/database/db.server";

export async function getUserByEmail(email: User["email"]) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}
