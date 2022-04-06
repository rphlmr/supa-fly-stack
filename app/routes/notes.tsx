import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData, Outlet, Link, NavLink } from "@remix-run/react";

import { getUserNoteListItems } from "~/models/note.server";
import { requireUserSession } from "~/services/session.server";
import { notFound } from "~/utils/request.server";

type LoaderData = NonNullable<Awaited<ReturnType<typeof getUserNoteListItems>>>;

export const loader: LoaderFunction = async ({ request }) => {
  const { userId } = await requireUserSession(request);

  const userNoteListItems = await getUserNoteListItems({ userId });

  if (!userNoteListItems) {
    throw notFound(`No user with id ${userId}`);
  }

  return json<LoaderData>(userNoteListItems);
};

export default function NotesPage() {
  const data = useLoaderData() as LoaderData;

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Notes</Link>
        </h1>
        <p>{data.email}</p>
        <Form
          action="/logout"
          method="post"
        >
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="flex h-full bg-white">
        <div className="h-full w-80 border-r bg-gray-50">
          <Link
            to="new"
            className="block p-4 text-xl text-blue-500"
          >
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
                    to={note.id}
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
