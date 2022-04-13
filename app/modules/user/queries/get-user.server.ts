import type { User } from "~/core/database";
import { db } from "~/core/database";

export async function getUserByEmail(email: User["email"]) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}
