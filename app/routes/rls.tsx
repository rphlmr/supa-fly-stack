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
  const { supabaseClient, accessToken } = useSupabase();

  useEffect(() => {
    // Here we want to listen to changes in the database only for authenticated users
    if (!supabaseClient || !accessToken) return;

    // This is a demo of how to use the realtime client to listen for server changes
    // This example enable realtime sync for the current user using this app in a mobile and a browser for example
    // On change, we'll reload all Remix loaders
    // More options here : https://supabase.com/docs/reference/javascript/subscribe
    const channel = supabaseClient
      .channel(`public:rls_notes`)
      .on(
        "postgres_changes",
        {
          event: "*",
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

    // Bind your access token to the channel. It allows you to make RLS based on role authenticated and to use (auth.uid() = my_column_with_user_id)
    channel.socket.setAuth(accessToken);

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [submit, supabaseClient, accessToken]);

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
