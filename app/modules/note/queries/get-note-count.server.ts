import { db } from "~/core/database/db.server";

export async function getNoteCount() {
  return db.note.count();
}
