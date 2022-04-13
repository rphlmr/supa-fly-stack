import type { Note, User } from "~/core/database";
import { db } from "~/core/database";

export async function deleteNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  return db.note.deleteMany({
    where: { id, userId },
  });
}
