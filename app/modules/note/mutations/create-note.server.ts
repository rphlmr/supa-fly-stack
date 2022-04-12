import type { Note, User } from "~/core/database/db.server";
import { db } from "~/core/database/db.server";

export async function createNote({
  title,
  body,
  userId,
}: Pick<Note, "body" | "title"> & {
  userId: User["id"];
}) {
  return db.note.create({
    data: {
      title,
      body,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
