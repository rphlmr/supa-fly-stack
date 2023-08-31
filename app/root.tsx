import { cssBundleHref } from "@remix-run/css-bundle";
import type {
	LinksFunction,
	LoaderFunction,
	V2_MetaFunction as MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";

import { i18nextServer } from "~/integrations/i18n";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getBrowserEnv } from "./utils/env";

export const links: LinksFunction = () => [
	{ rel: "preload", href: tailwindStylesheetUrl, as: "style" },
	{ rel: "stylesheet", href: tailwindStylesheetUrl, as: "style" },
	...(cssBundleHref
		? [
				{ rel: "preload", href: cssBundleHref, as: "style" },
				{ rel: "stylesheet", href: cssBundleHref },
		  ]
		: []),
];

export const meta: MetaFunction = () => [
	{ title: "Remix Notes" },
	{ name: "description", content: "Remix Notes App" },
];

export const loader: LoaderFunction = async ({ request }) => {
	const locale = await i18nextServer.getLocale(request);
	return json({
		locale,
		env: getBrowserEnv(),
	});
};

export default function App() {
	const { env, locale } = useLoaderData<typeof loader>();
	const { i18n } = useTranslation();

	useChangeLanguage(locale);

	return (
		<html lang={locale} dir={i18n.dir()} className="h-full">
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width,initial-scale=1.0,maximum-scale=1.0"
				/>
				<Links />
			</head>
			<body className="h-full">
				<Outlet />
				<ScrollRestoration />
				<script
					dangerouslySetInnerHTML={{
						__html: `window.env = ${JSON.stringify(env)}`,
					}}
				/>
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
