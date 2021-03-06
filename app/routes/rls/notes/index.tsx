import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAuthSession } from "~/core/auth/guards";
import { supabaseAdmin } from "~/core/integrations/supabase/supabase.server";
// import { useWatchNotes } from "~/modules/note/hooks";

export async function loader({ request }: LoaderArgs) {
  await requireAuthSession(request);

  // use "supabaseAdmin" to override rls for this request only, to get all notes count
  const { count: nbOfNotes } = await supabaseAdmin
    .from("Note")
    .select("id", { count: "exact", head: true });

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
