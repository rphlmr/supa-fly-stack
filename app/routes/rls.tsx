import { useEffect } from "react";

import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  Outlet,
  Link,
  NavLink,
  useFetcher,
} from "@remix-run/react";

import {
  getSupabase,
  getSupabaseAdmin,
  useSupabase,
} from "~/integrations/supabase";
import { LogoutButton, requireAuthSession } from "~/modules/auth";
import { notFound } from "~/utils/http.server";

export function action() {
  return null;
}

export async function loader({ request }: LoaderArgs) {
  const { userId, email, accessToken } = await requireAuthSession(request);

  const [{ count: nbOfNotesOnServer }, myNotes] = await Promise.all([
    getSupabaseAdmin().from("rls_notes").select("id", { count: "exact" }),
    getSupabase(accessToken).from("rls_notes").select("*"),
  ]);

  const { data, error } = myNotes;

  if (error) {
    throw notFound(`No user with id ${userId}`);
  }

  return json({ email, notes: data, nbOfNotesOnServer });
}

export default function NotesPage() {
  const data = useLoaderData<typeof loader>();
  const { submit } = useFetcher();
  const supabase = useSupabase();

  useEffect(() => {
    if (!supabase) return;

    // This is a demo of how to use the realtime client to listen for server changes
    // On change, we'll reload all Remix loaders
    // More options here : https://supabase.com/docs/reference/javascript/subscribe
    const subscription = supabase
      .channel(`public:rls_notes`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rls_notes",
        },
        () => {
          submit(null, {
            method: "post",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [submit, supabase]);

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Notes</Link>
        </h1>
        <div className="flex flex-col items-center">
          <span>{data.email}</span>
          <span>There is {data.nbOfNotesOnServer} notes on the server</span>
        </div>

        <LogoutButton />
      </header>

      <main className="flex h-full bg-white">
        <div className="h-full w-80 border-r bg-gray-50">
          <Link to="new" className="block p-4 text-xl text-blue-500">
            + New Note
          </Link>

          <hr />

          {data.notes.length === 0 ? (
            <p className="p-4">No notes yet</p>
          ) : (
            <ol>
              {data.notes.map((note) => (
                <li key={note.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={String(note.id)}
                  >
                    📝 {note.title}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
