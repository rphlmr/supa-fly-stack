import { User } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { prisma } from "~/database/prisma.server";

export type { User } from "@prisma/client";

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email: email.toLowerCase() } });
}

export async function createUser({
  email,
  id,
}: Pick<SupabaseUser, "id" | "email">) {
  return prisma.user
    .create({
      data: {
        email: email!,
        id: id,
      },
    })
    .then(() => ({ createUserError: null }))
    .catch((createUserError) => ({ createUserError }));
}
