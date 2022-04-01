import type { User, Note } from "@prisma/client";

import { prisma } from "~/database/prisma.server";
export type { Note } from "@prisma/client";

export async function getNote({
  userId,
  id,
}: Pick<Note, "id"> & {
  userId: User["id"];
}) {
  return prisma.note.findFirst({
    where: { id, userId },
  });
}

export async function getNoteListItems({ userId }: { userId: User["id"] }) {
  return prisma.note.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getUserNoteListItems({ userId }: { userId: User["id"] }) {
  return prisma.user.findUnique({
    select: {
      id: true,
      email: true,
      notes: {
        select: { id: true, title: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    where: { id: userId },
  });
}

export async function createNote({
  title,
  body,
  userId,
}: Pick<Note, "body" | "title"> & {
  userId: User["id"];
}) {
  return prisma.note.create({
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

export async function deleteNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  return prisma.note.deleteMany({
    where: { id, userId },
  });
}

export async function getNoteCount() {
  return prisma.note.count();
}
