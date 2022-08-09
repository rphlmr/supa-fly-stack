import type { User } from "~/database";
import { db } from "~/database";

export async function getUserByEmail(email: User["email"]) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}
