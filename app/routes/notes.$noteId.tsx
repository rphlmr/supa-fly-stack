import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useLoaderData, useRouteError } from "@remix-run/react";

import { requireAuthSession, commitAuthSession } from "~/modules/auth";
import { deleteNote, getNote } from "~/modules/note";
import { assertIsDelete, getRequiredParam } from "~/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
	const { userId } = await requireAuthSession(request);

	const id = getRequiredParam(params, "noteId");

	const note = await getNote({ userId, id });
	if (!note) {
		throw new Response("Not Found", { status: 404 });
	}
	return json({ note });
}

export async function action({ request, params }: ActionFunctionArgs) {
	assertIsDelete(request);
	const id = getRequiredParam(params, "noteId");
	const authSession = await requireAuthSession(request);

	await deleteNote({ userId: authSession.userId, id });

	return redirect("/notes", {
		headers: {
			"Set-Cookie": await commitAuthSession(request, { authSession }),
		},
	});
}

export default function NoteDetailsPage() {
	const data = useLoaderData<typeof loader>();

	return (
		<div>
			<h3 className="text-2xl font-bold">{data.note.title}</h3>
			<p className="py-6">{data.note.body}</p>
			<hr className="my-4" />
			<Form method="delete">
				<button
					type="submit"
					className="rounded bg-blue-500  px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
				>
					Delete
				</button>
			</Form>
		</div>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	return <div>{JSON.stringify(error, null, 2)}</div>;
}


