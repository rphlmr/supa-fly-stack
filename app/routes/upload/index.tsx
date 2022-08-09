import { useEffect, useRef } from "react";

import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import {
  unstable_composeUploadHandlers,
  json,
  unstable_parseMultipartFormData,
} from "@remix-run/node";

import { useTypedFetcher } from "~/hooks/use-fetcher";
import { requireAuthSession } from "~/modules/auth/guards";
import { commitAuthSession } from "~/modules/auth/session.server";
import { uploadFile } from "~/utils/upload-file.server";

import type { action as deleteAction } from "./delete";

export function loader({ request }: LoaderArgs) {
  return requireAuthSession(request);
}

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request);

  // check : https://remix.run/docs/en/v1/api/remix#uploadhandler
  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, data, filename, contentType }) => {
      if (name !== "avatar" || !filename) {
        return null;
      }

      // we could test for filename already exists before uploading
      // I won't do it here for simplicity
      return uploadFile(data, {
        filename,
        contentType,
        filePath: `${authSession.userId}/${filename}`,
      });
    }
  );

  const fileForm = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  return json(
    { url: fileForm.get("avatar") as string },
    {
      headers: {
        "Set-Cookie": await commitAuthSession(request, { authSession }),
      },
    }
  );
}

export default function Upload() {
  const upload = useTypedFetcher<typeof action>();
  const remove = useTypedFetcher<typeof deleteAction>();
  const formRef = useRef<HTMLFormElement>(null);
  const showPreview = useRef(false);

  useEffect(() => {
    if (remove.state === "submitting") {
      formRef.current?.reset();
      showPreview.current = false;
    }
  }, [remove.state]);

  useEffect(() => {
    if (upload.data?.url) {
      showPreview.current = true;
    }
  }, [upload.data]);

  const submitUpload = (formData: FormData) => {
    upload.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  return (
    <div className="mx-auto mt-10 flex max-w-full flex-col items-center">
      <div className="my-10 text-center font-bold">
        <p>
          You have to create a Public Supabase Bucket (named "public") before
          using this feature
        </p>

        <a
          href="https://supabase.com/docs/guides/storage"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400"
        >
          👉 Supabase Storage guide
        </a>

        <p>
          Doesn't handle filename collisions. If you upload a file with the same
          name, you will see nothing happen.
        </p>
      </div>

      <upload.Form
        ref={formRef}
        className="max-w-lg"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.nativeEvent.preventDefault();

          const file = e.dataTransfer.files?.[0];

          if (!file) return;

          const formData = new FormData();
          formData.set("avatar", file);

          submitUpload(formData);
        }}
        onChange={(e) => {
          const formData = new FormData(e.currentTarget);

          submitUpload(formData);
        }}
      >
        <div className="flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="avatar"
                className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
              >
                <span>Upload a file</span>
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF, up to 10MB</p>
          </div>
        </div>
      </upload.Form>
      <div className="mt-10">
        <button
          className="inline-flex items-center rounded border border-transparent bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={() => {
            remove.submit(null, {
              action: "/upload/delete",
              method: "delete",
            });
          }}
        >
          Delete all files
        </button>
      </div>
      {upload.data?.url && showPreview.current ? (
        <div className="mt-10">
          <img
            alt="preview"
            src={upload.data.url}
          />
        </div>
      ) : null}
    </div>
  );
}
