import type { Note, User } from "~/core/database/db.server";
import { db } from "~/core/database/db.server";

export async function deleteNote({ id, userId }: Pick<Note, "id"> & { userId: User["id"] }) {
  return db.note.deleteMany({
    where: { id, userId },
  });
}
