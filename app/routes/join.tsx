import * as React from "react";

import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
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

import i18next from "~/i18next.server";
import { ContinueWithEmailForm } from "~/modules/auth/components";
import {
  createAuthSession,
  getAuthSession,
} from "~/modules/auth/session.server";
import { createUserAccount } from "~/modules/user/mutations";
import { getUserByEmail } from "~/modules/user/queries";
import { assertIsPost } from "~/utils/http.server";

export const handle = { i18n: "auth" };

export async function loader({ request }: LoaderArgs) {
  const authSession = await getAuthSession(request);
  const t = await i18next.getFixedT(request, "auth");
  const title = t("register.title");

  if (authSession) return redirect("/notes");

  return json({ title });
}

const JoinFormSchema = z.object({
  email: z
    .string()
    .email("invalid-email")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, "password-too-short"),
  redirectTo: z.string().optional(),
});

export async function action({ request }: ActionArgs) {
  assertIsPost(request);

  const formValidation = await getFormData(request, JoinFormSchema);

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

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return json(
      { errors: { email: "user-already-exist", password: null } },
      { status: 400 }
    );
  }

  const authSession = await createUserAccount(email, password);

  if (!authSession) {
    return json(
      { errors: { email: "unable-to-create-account", password: null } },
      { status: 500 }
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

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const inputProps = useFormInputProps(JoinFormSchema);
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
              {t("register.email")}
            </label>
            <div className="mt-1">
              <input
                {...inputProps("email")}
                ref={emailRef}
                data-test-id="email"
                id="email"
                required
                autoFocus={true}
                name="email"
                type="email"
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
              {t("register.password")}
            </label>
            <div className="mt-1">
              <input
                {...inputProps("password")}
                ref={passwordRef}
                data-test-id="password"
                id="password"
                name="password"
                type="password"
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
            data-test-id="create-account"
            type="submit"
            className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
            disabled={disabled}
          >
            {t("register.action")}
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              {t("register.alreadyHaveAnAccount")}{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                {t("register.login")}
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
                {t("register.orContinueWith")}
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
