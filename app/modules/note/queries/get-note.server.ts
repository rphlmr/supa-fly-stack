import type { Note, User } from "~/core/database/db.server";
import { db } from "~/core/database/db.server";

export async function getNote({
  userId,
  id,
}: Pick<Note, "id"> & {
  userId: User["id"];
}) {
  return db.note.findFirst({
    where: { id, userId },
  });
}
