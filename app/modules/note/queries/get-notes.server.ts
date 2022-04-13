import type { User } from "~/core/database";
import { db } from "~/core/database";

export async function getNotes({ userId }: { userId: User["id"] }) {
  return db.note.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}
