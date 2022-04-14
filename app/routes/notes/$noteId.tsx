import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { requireAuthSession } from "~/core/auth/guards";
import { commitAuthSession } from "~/core/auth/session.server";
import type { Note } from "~/core/database";
import { assertIsDelete } from "~/core/utils/http.server";
import { deleteNote } from "~/modules/note/mutations";
import { getNote } from "~/modules/note/queries";

type LoaderData = {
  note: Note;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { userId } = await requireAuthSession(request);
  invariant(params.noteId, "noteId not found");

  const note = await getNote({ userId, id: params.noteId });
  if (!note) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({ note });
};

export const action: ActionFunction = async ({ request, params }) => {
  assertIsDelete(request);

  const authSession = await requireAuthSession(request);
  invariant(params.noteId, "noteId not found");

  await deleteNote({ userId: authSession.userId, id: params.noteId });

  return redirect("/notes", {
    headers: {
      "Set-Cookie": await commitAuthSession(request, { authSession }),
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
