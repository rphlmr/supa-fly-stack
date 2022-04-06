import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteNote, getNote } from "~/models/note.server";
import type { Note } from "~/models/note.server";
import {
  commitUserSession,
  requireUserSession,
} from "~/services/session.server";

type LoaderData = {
  note: Note;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { userId } = await requireUserSession(request);
  invariant(params.noteId, "noteId not found");

  const note = await getNote({ userId, id: params.noteId });
  if (!note) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({ note });
};

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== "DELETE") {
    return json({ message: "Method not allowed" }, 405);
  }

  const userSession = await requireUserSession(request);
  invariant(params.noteId, "noteId not found");

  await deleteNote({ userId: userSession.userId, id: params.noteId });

  return redirect("/notes", {
    headers: {
      "Set-Cookie": await commitUserSession(request, { userSession }),
    },
  });
};

export default function NoteDetailsPage() {
  const data = useLoaderData() as LoaderData;

  return (
    <div>
      <h3 className="text-2xl font-bold">{data.note.title}</h3>
      <p className="py-6">{data.note.body}</p>
      <hr className="my-4" />
      <Form method="delete">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Note not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
