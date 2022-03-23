import * as React from "react";
import { Form, json, redirect, useActionData, useTransition } from "remix";
import type { ActionFunction } from "remix";
import Alert from "@reach/alert";
import {
  commitUserSession,
  requireUserSession,
} from "~/services/session.server";
import { createNote } from "~/models/note.server";
import { z } from "zod";
import { getFormData, useFormInputProps } from "remix-params-helper";

export const NewNoteFormSchema = z.object({
  title: z.string().min(2, "require-title"),
  body: z.string().min(1, "require-body"),
});

type ActionData = {
  errors?: {
    title?: string;
    body?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userSession = await requireUserSession(request);
  const formValidation = await getFormData(request, NewNoteFormSchema);

  if (!formValidation.success) {
    return json<ActionData>(
      {
        errors: formValidation.errors,
      },
      {
        status: 400,
        headers: {
          "Set-Cookie": await commitUserSession(request, { userSession }),
        },
      }
    );
  }

  const { title, body } = formValidation.data;

  const note = await createNote({ title, body, userId: userSession.userId });

  return redirect(`/notes/${note.id}`, {
    headers: {
      "Set-Cookie": await commitUserSession(request, { userSession }),
    },
  });
};

export default function NewNotePage() {
  const actionData = useActionData() as ActionData;
  const titleRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const inputProps = useFormInputProps(NewNoteFormSchema);
  const transition = useTransition();
  const disabled =
    transition.state === "submitting" || transition.state === "loading";

  console.log(transition.state);

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
          <Alert className="pt-1 text-red-700" id="title=error">
            {actionData.errors.title}
          </Alert>
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
          <Alert className="pt-1 text-red-700" id="body=error">
            {actionData.errors.body}
          </Alert>
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
