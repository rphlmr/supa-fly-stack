import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
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
import { SupabaseProvider } from "~/integrations/supabase";
import { getAuthSession } from "~/modules/auth";
import { getBrowserEnv } from "~/utils/env";

import tailwindStylesheetUrl from "./styles/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheetUrl },
];

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Remix Notes",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({ request }) => {
  const [locale, authSession] = await Promise.all([
    i18nextServer.getLocale(request),
    getAuthSession(request),
  ]);

  const { accessToken, expiresAt, expiresIn } = authSession || {};

  return json({
    locale,
    env: getBrowserEnv(),
    authSession: {
      accessToken,
      expiresAt,
      expiresIn,
    },
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
        <Links />
      </head>
      <body className="h-full">
        <SupabaseProvider>
          <Outlet />
        </SupabaseProvider>
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
