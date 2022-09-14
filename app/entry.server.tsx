import { resolve } from "node:path";
import { PassThrough } from "stream";

import { Response } from "@remix-run/node";
import type { EntryContext, Headers } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { createInstance } from "i18next";
import Backend from "i18next-fs-backend";
import isbot from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";

import i18n from "./i18n"; // your i18n configuration file
import i18next from "./i18next.server";

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  return new Promise(async (res, reject) => {
    let didError = false;

    // First, we create a new instance of i18next so every request will have a
    // completely unique instance and not share any state
    const instance = createInstance();

    // Then we could detect locale from the request
    const lng = await i18next.getLocale(request);
    // And here we detect what namespaces the routes about to render want to use
    const ns = i18next.getRouteNamespaces(remixContext);

    await instance
      .use(initReactI18next) // Tell our instance to use react-i18next
      .use(Backend) // Setup our backend
      .init({
        ...i18n, // spread the configuration
        lng, // The locale we detected above
        ns, // The namespaces the routes about to render wants to use
        backend: {
          loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
        },
      });

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={instance}>
        <RemixServer
          context={remixContext}
          url={request.url}
        />
      </I18nextProvider>,
      {
        [callbackName]() {
          const body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");

          res(
            new Response(body, {
              status: didError ? 500 : responseStatusCode,
              headers: responseHeaders,
            })
          );
          pipe(body);
        },
        onShellError(err: unknown) {
          reject(err);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
