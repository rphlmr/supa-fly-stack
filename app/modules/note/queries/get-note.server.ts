import type { Note, User } from "~/core/database";
import { db } from "~/core/database";

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
