import { useEffect } from "react";

import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useSubmit } from "@remix-run/react";

import { requireAuthSession } from "~/core/auth/guards";
import { useSupabase } from "~/core/integrations/supabase/context";
import { getNoteCount } from "~/modules/note/queries";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuthSession(request);

  const nbOfNotes = await getNoteCount();

  return json({
    nbOfNotes,
  });
};

export default function NoteIndexPage() {
  const supabase = useSupabase();
  const { nbOfNotes } = useLoaderData();
  const submit = useSubmit();

  useEffect(() => {
    const subscription = supabase
      .from("Note")
      .on("INSERT", () => {
        submit(null, { replace: true });
      })
      .on("DELETE", () => {
        submit(null, { replace: true });
      })
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, submit]);

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
        <h2>Live stream number of notes</h2>
        <span>{nbOfNotes}</span>
      </div>
    </>
  );
}
