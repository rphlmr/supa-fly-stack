import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";

import { getSupabase } from "~/integrations/supabase";
import { requireAuthSession, commitAuthSession } from "~/modules/auth";
import { assertIsDelete, getRequiredParam } from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
  const { accessToken } = await requireAuthSession(request);

  const id = getRequiredParam(params, "noteId");

  const { data, error } = await getSupabase(accessToken)
    .from("rls_notes")
    .select()
    .eq("id", id);

  if (error) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ note: data[0] });
}

export async function action({ request, params }: ActionArgs) {
  assertIsDelete(request);
  const id = getRequiredParam(params, "noteId");
  const authSession = await requireAuthSession(request);

  await getSupabase(authSession.accessToken)
    .from("rls_notes")
    .delete()
    .eq("id", id);

  return redirect("/rls", {
    headers: {
      "Set-Cookie": await commitAuthSession(request, { authSession }),
    },
  });
}

export default function NoteDetailsPage() {
  const data = useLoaderData<typeof loader>();

  if (!data.note) {
    return <div>Not found</div>;
  }

  return (
    <div>
      <h3 className="text-2xl font-bold">{data.note.title}</h3>
      <p className="py-6">{data.note.body}</p>
      <hr className="my-4" />
      <Form method="delete">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white focus:bg-blue-400 hover:bg-blue-600"
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
