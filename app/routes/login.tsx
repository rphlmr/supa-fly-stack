import * as React from "react";

import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import { getFormData, useFormInputProps } from "remix-params-helper";
import { z } from "zod";

import { signInWithEmail } from "~/core/auth/mutations";
import { createAuthSession, getAuthSession } from "~/core/auth/session.server";
import { ContinueWithEmailForm } from "~/core/components";
import { assertIsPost } from "~/core/utils/http.server";

export const loader: LoaderFunction = async ({ request }) => {
  const authSession = await getAuthSession(request);

  if (authSession) return redirect("/notes");

  return json({});
};

const LoginFormSchema = z.object({
  email: z
    .string()
    .email("invalid-email")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, "password-too-short"),
  redirectTo: z.string().optional(),
});

interface ActionData {
  errors?: {
    email?: string;
    password?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  assertIsPost(request);

  const formValidation = await getFormData(request, LoginFormSchema);

  if (!formValidation.success) {
    return json<ActionData>(
      {
        errors: formValidation.errors,
      },
      { status: 400 }
    );
  }

  const { email, password, redirectTo = "/notes" } = formValidation.data;

  const authSession = await signInWithEmail(email, password);

  if (!authSession) {
    return json<ActionData>(
      { errors: { email: "invalid-email-password" } },
      { status: 400 }
    );
  }

  return createAuthSession({
    request,
    authSession,
    redirectTo,
  });
};

export const meta: MetaFunction = () => ({
  title: "Login",
});

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData() as ActionData;
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputProps = useFormInputProps(LoginFormSchema);
  const transition = useTransition();
  const disabled =
    transition.state === "submitting" || transition.state === "loading";

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form
          method="post"
          className="space-y-6"
          ref={formRef}
          replace
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <div className="mt-1">
              <input
                {...inputProps("email")}
                ref={emailRef}
                id="email"
                type="email"
                required
                autoFocus={true}
                autoComplete="email"
                aria-invalid={actionData?.errors?.email ? true : undefined}
                aria-describedby="email-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                disabled={disabled}
              />
              {actionData?.errors?.email && (
                <div
                  className="pt-1 text-red-700"
                  id="email-error"
                >
                  {actionData.errors.email}
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                {...inputProps("password")}
                type="password"
                id="password"
                ref={passwordRef}
                autoComplete="new-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                disabled={disabled}
              />
              {actionData?.errors?.password && (
                <div
                  className="pt-1 text-red-700"
                  id="password-error"
                >
                  {actionData.errors.password}
                </div>
              )}
            </div>
          </div>

          <input
            type="hidden"
            name="redirectTo"
            value={redirectTo}
          />
          <button
            type="submit"
            className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
            disabled={disabled}
          >
            Log in
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/join",
                  search: searchParams.toString(),
                }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </Form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>
          <div className="mt-6">
            <ContinueWithEmailForm />
          </div>
        </div>
      </div>
    </div>
  );
}
