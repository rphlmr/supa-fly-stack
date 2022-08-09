import React from "react";

import type { action } from "~/routes/send-magic-link";

import { useTypedFetcher } from "../../../hooks/use-fetcher";

export function ContinueWithEmailForm() {
  const ref = React.useRef<HTMLFormElement>(null);
  const sendMagicLink = useTypedFetcher<typeof action>();
  const { data, state, type } = sendMagicLink;
  const isSuccessFull = type === "done" && !data?.error;
  const isLoading = state === "submitting" || state === "loading";
  const buttonLabel = isLoading
    ? "Sending you a link..."
    : "Continue with email";

  React.useEffect(() => {
    if (isSuccessFull) {
      ref.current?.reset();
    }
  }, [isSuccessFull]);

  return (
    <sendMagicLink.Form
      method="post"
      action="/send-magic-link"
      replace={false}
      ref={ref}
    >
      <input
        type="email"
        name="email"
        id="magic-link"
        className="mb-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
        disabled={isLoading}
      />
      <div
        className={`mb-2 h-6 text-center ${data?.error ? "text-red-600" : ""} ${
          isSuccessFull ? "text-green-600" : ""
        }`}
      >
        {!isSuccessFull ? data?.error : "Check your emails ✌️"}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center rounded-md bg-green-500 px-4 py-3 font-medium text-white hover:bg-green-600  "
      >
        {buttonLabel}
      </button>
    </sendMagicLink.Form>
  );
}
