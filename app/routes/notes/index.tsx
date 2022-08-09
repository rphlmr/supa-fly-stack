import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAuthSession } from "~/modules/auth/guards";
// import { useWatchNotes } from "~/modules/note/hooks";
import { getNoteCount } from "~/modules/note/queries";

export async function loader({ request }: LoaderArgs) {
  await requireAuthSession(request);

  const nbOfNotes = await getNoteCount();

  return json({
    nbOfNotes,
  });
}

export default function NoteIndexPage() {
  const { nbOfNotes } = useLoaderData<typeof loader>();
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
        <h2>Total number of notes on database:</h2>
        <span>{nbOfNotes}</span>
      </div>
    </>
  );
}
