import * as React from "react";

import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useTransition } from "@remix-run/react";
import cuid from "cuid";
import { getFormData, useFormInputProps } from "remix-params-helper";
import { z } from "zod";

import { getSupabase } from "~/integrations/supabase";
import { requireAuthSession } from "~/modules/auth/guards";
import { commitAuthSession } from "~/modules/auth/session.server";
import { assertIsPost } from "~/utils/http.server";

export const NewNoteFormSchema = z.object({
  title: z.string().min(2, "require-title"),
  body: z.string().min(1, "require-body"),
});

export async function action({ request }: LoaderArgs) {
  assertIsPost(request);

  const authSession = await requireAuthSession(request);
  const formValidation = await getFormData(request, NewNoteFormSchema);

  if (!formValidation.success) {
    return json(
      {
        errors: {
          title: formValidation.errors.title,
          body: formValidation.errors.body,
        },
      },
      {
        status: 400,
        headers: {
          "Set-Cookie": await commitAuthSession(request, { authSession }),
        },
      }
    );
  }

  const { title, body } = formValidation.data;

  const { data, error } = await getSupabase(authSession.accessToken)
    .from("Note")
    .insert([
      {
        id: cuid(),
        title,
        body,
        userId: authSession.userId,
        updatedAt: new Date(),
      },
    ]);

  const newNote = data?.[0];

  if (!newNote || error) {
    throw json(
      { error: "server-error-creating-note" },
      {
        status: 500,
        headers: {
          "Set-Cookie": await commitAuthSession(request, { authSession }),
        },
      }
    );
  }

  return redirect(`/rls/notes/${newNote.id}`, {
    headers: {
      "Set-Cookie": await commitAuthSession(request, { authSession }),
    },
  });
}

export default function NewNotePage() {
  const actionData = useActionData<typeof action>();
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const inputProps = useFormInputProps(NewNoteFormSchema);
  const transition = useTransition();
  const disabled =
    transition.state === "submitting" || transition.state === "loading";

  React.useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.body) {
      bodyRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Title: </span>
          <input
            {...inputProps("title")}
            ref={titleRef}
            name="title"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.title ? true : undefined}
            aria-errormessage={
              actionData?.errors?.title ? "title-error" : undefined
            }
            disabled={disabled}
          />
        </label>
        {actionData?.errors?.title && (
          <div
            className="pt-1 text-red-700"
            id="title-error"
          >
            {actionData.errors.title}
          </div>
        )}
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Body: </span>
          <textarea
            {...inputProps("body")}
            ref={bodyRef}
            name="body"
            rows={8}
            className="w-full flex-1 rounded-md border-2 border-blue-500 py-2 px-3 text-lg leading-6"
            aria-invalid={actionData?.errors?.body ? true : undefined}
            aria-errormessage={
              actionData?.errors?.body ? "body-error" : undefined
            }
            disabled={disabled}
          />
        </label>
        {actionData?.errors?.body && (
          <div
            className="pt-1 text-red-700"
            id="body-error"
          >
            {actionData.errors.body}
          </div>
        )}
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          disabled={disabled}
        >
          Save
        </button>
      </div>
    </Form>
  );
}
