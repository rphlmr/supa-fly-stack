import { db } from "~/core/database";

export async function getNoteCount() {
  return db.note.count();
}
