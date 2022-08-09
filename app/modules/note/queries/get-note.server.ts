import type { Note, User } from "~/database";
import { db } from "~/database";

export async function getNote({
  userId,
  id,
}: Pick<Note, "id"> & {
  userId: User["id"];
}) {
  return db.note.findFirst({
    select: { id: true, body: true, title: true },
    where: { id, userId },
  });
}
