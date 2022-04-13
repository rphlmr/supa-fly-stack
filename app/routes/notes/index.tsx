import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAuthSession } from "~/core/auth/guards";
// import { useWatchNotes } from "~/modules/note/hooks";
import { getNoteCount } from "~/modules/note/queries";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuthSession(request);

  const nbOfNotes = await getNoteCount();

  return json({
    nbOfNotes,
  });
};

export default function NoteIndexPage() {
  const { nbOfNotes } = useLoaderData();
  // useWatchNotes();

  return (
    <>
      <p>
        No note selected. Select a note on the left, or{" "}
        <Link
          to="new"
          className="text-blue-500 underline"
        >
          create a new note.
        </Link>
      </p>
      <br />
      <div>
        <h2>Server number of notes:</h2>
        <span>{nbOfNotes}</span>
      </div>
    </>
  );
}
