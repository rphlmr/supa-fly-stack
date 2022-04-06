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

import { SupabaseProvider } from "~/context/supabase";
import { getUserSession } from "~/services/session.server";

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
  const userSession = await getUserSession(request);

  return json({
    realtimeSession: {
      accessToken: userSession?.accessToken,
      expiresIn: userSession?.expiresIn,
      expiresAt: userSession?.expiresAt,
    },
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_PUBLIC: process.env.SUPABASE_ANON_PUBLIC,
    },
  });
};

export default function App() {
  const { ENV } = useLoaderData() as Window;

  return (
    <html
      lang="en"
      className="h-full"
    >
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
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
