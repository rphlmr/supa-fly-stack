import { useEffect, useState } from "react";

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { parseFormAny, useZorm } from "react-zorm";
import { z } from "zod";

import { i18nextServer } from "~/integrations/i18n";
import { supabaseClient } from "~/integrations/supabase";
import {
	commitAuthSession,
	getAuthSession,
	refreshAccessToken,
	updateAccountPassword,
} from "~/modules/auth";
import { assertIsPost, isFormProcessing, tw } from "~/utils";

export async function loader({ request }: LoaderFunctionArgs) {
	const authSession = await getAuthSession(request);
	const t = await i18nextServer.getFixedT(request, "auth");
	const title = t("register.changePassword");

	if (authSession) return redirect("/notes");

	return json({ title });
}

const ResetPasswordSchema = z
	.object({
		password: z.string().min(8, "password-too-short"),
		confirmPassword: z.string().min(8, "password-too-short"),
		refreshToken: z.string(),
	})
	.superRefine(({ password, confirmPassword, refreshToken }, ctx) => {
		if (password !== confirmPassword) {
			return ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Password and confirm password must match",
				path: ["confirmPassword"],
			});
		}

		return { password, confirmPassword, refreshToken };
	});

export async function action({ request }: ActionFunctionArgs) {
	assertIsPost(request);

	const formData = await request.formData();
	const result = await ResetPasswordSchema.safeParseAsync(
		parseFormAny(formData),
	);

	if (!result.success) {
		return json(
			{
				message: "invalid-request",
			},
			{ status: 400 },
		);
	}

	const { password, refreshToken } = result.data;

	// We should not trust what is sent from the client
	// https://github.com/rphlmr/supa-fly-stack/issues/45
	const authSession = await refreshAccessToken(refreshToken);

	if (!authSession) {
		return json(
			{
				message: "invalid-refresh-token",
			},
			{ status: 401 },
		);
	}

	const user = await updateAccountPassword(authSession.userId, password);

	if (!user) {
		return json(
			{
				message: "update-password-error",
			},
			{ status: 500 },
		);
	}

	return redirect("/notes", {
		headers: {
			"Set-Cookie": await commitAuthSession(request, {
				authSession,
			}),
		},
	});
}

export default function ResetPassword() {
	const zo = useZorm("ResetPasswordForm", ResetPasswordSchema);
	const { t } = useTranslation("auth");
	const [userRefreshToken, setUserRefreshToken] = useState("");
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const disabled = isFormProcessing(navigation.state);

	useEffect(() => {
		const {
			data: { subscription },
		} = supabaseClient.auth.onAuthStateChange((event, supabaseSession) => {
			// In local development, we doesn't see "PASSWORD_RECOVERY" event because:
			// Effect run twice and break listener chain
			if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
				const refreshToken = supabaseSession?.refresh_token;

				if (!refreshToken) return;

				setUserRefreshToken(refreshToken);
			}
		});

		return () => {
			// prevent memory leak. Listener stays alive 👨‍🎤
			subscription.unsubscribe();
		};
	}, []);

	return (
		<div className="flex min-h-full flex-col justify-center">
			<div className="mx-auto w-full max-w-md px-8">
				<Form ref={zo.ref} method="post" className="space-y-6" replace>
					<div>
						<label
							htmlFor={zo.fields.password()}
							className="block text-sm font-medium text-gray-700"
						>
							{t("register.password")}
						</label>
						<div className="mt-1">
							<input
								data-test-id="password"
								name={zo.fields.password()}
								type="password"
								autoComplete="new-password"
								className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
								disabled={disabled}
							/>
							{zo.errors.password()?.message && (
								<div
									className="pt-1 text-red-700"
									id="password-error"
								>
									{zo.errors.password()?.message}
								</div>
							)}
						</div>
					</div>
					<div>
						<label
							htmlFor={zo.fields.confirmPassword()}
							className="block text-sm font-medium text-gray-700"
						>
							{t("register.confirmPassword")}
						</label>
						<div className="mt-1">
							<input
								data-test-id="confirmPassword"
								name={zo.fields.confirmPassword()}
								type="password"
								autoComplete="new-password"
								className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
								disabled={disabled}
							/>
							{zo.errors.confirmPassword()?.message && (
								<div
									className="pt-1 text-red-700"
									id="password-error"
								>
									{zo.errors.confirmPassword()?.message}
								</div>
							)}
						</div>
					</div>

					<input
						type="hidden"
						name={zo.fields.refreshToken()}
						value={userRefreshToken}
					/>
					<button
						data-test-id="change-password"
						type="submit"
						className="w-full rounded bg-blue-500  px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
						disabled={disabled}
					>
						{t("register.changePassword")}
					</button>
				</Form>
				{actionData?.message ? (
					<div className="flex flex-col items-center">
						<div
							className={tw(`mb-2 h-6 text-center text-red-600`)}
						>
							{actionData.message}
						</div>
						<Link
							className="text-blue-500 underline"
							to="/forgot-password"
						>
							Resend link
						</Link>
					</div>
				) : null}
			</div>
		</div>
	);
}
