import type { Note, User } from "~/database";
import { db } from "~/database";

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
