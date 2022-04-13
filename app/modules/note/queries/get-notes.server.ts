import type { User } from "~/core/database/db.server";
import { db } from "~/core/database/db.server";

export async function getNotes({ userId }: { userId: User["id"] }) {
  return db.note.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}
