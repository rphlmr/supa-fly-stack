import * as React from "react";

import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { getFormData, useFormInputProps } from "remix-params-helper";
import { z } from "zod";

import { i18nextServer } from "~/integrations/i18n";
import {
  createAuthSession,
  getAuthSession,
  signInWithEmail,
  ContinueWithEmailForm,
} from "~/modules/auth";
import { assertIsPost } from "~/utils";

export async function loader({ request }: LoaderArgs) {
  const authSession = await getAuthSession(request);
  const t = await i18nextServer.getFixedT(request, "auth");
  const title = t("login.title");

  if (authSession) return redirect("/notes");

  return json({ title });
}

const LoginFormSchema = z.object({
  email: z
    .string()
    .email("invalid-email")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, "password-too-short"),
  redirectTo: z.string().optional(),
});

export async function action({ request }: ActionArgs) {
  assertIsPost(request);

  const formValidation = await getFormData(request, LoginFormSchema);

  if (!formValidation.success) {
    return json(
      {
        errors: {
          email: formValidation.errors.email,
          password: formValidation.errors.password,
        },
      },
      { status: 400 }
    );
  }

  const { email, password, redirectTo = "/notes" } = formValidation.data;

  const authSession = await signInWithEmail(email, password);

  if (!authSession) {
    return json(
      { errors: { email: "invalid-email-password", password: null } },
      { status: 400 }
    );
  }

  return createAuthSession({
    request,
    authSession,
    redirectTo,
  });
}

export const meta: MetaFunction = ({ data }) => ({
  title: data.title,
});

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const inputProps = useFormInputProps(LoginFormSchema);
  const transition = useTransition();
  const { t } = useTranslation("auth");
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
          replace
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t("login.email")}
            </label>

            <div className="mt-1">
              <input
                {...inputProps("email")}
                data-test-id="email"
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
              {t("login.password")}
            </label>
            <div className="mt-1">
              <input
                {...inputProps("password")}
                data-test-id="password"
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
            data-test-id="login"
            type="submit"
            className="w-full rounded bg-blue-500 py-2 px-4 text-white focus:bg-blue-400 hover:bg-blue-600"
            disabled={disabled}
          >
            {t("login.action")}
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              {t("login.dontHaveAccount")}{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/join",
                  search: searchParams.toString(),
                }}
              >
                {t("login.signUp")}
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
                {t("login.orContinueWith")}
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
