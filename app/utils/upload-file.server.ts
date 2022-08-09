import { supabaseAdmin } from "../integrations/supabase/supabase.server";

async function convertToFile(
  data: AsyncIterable<Uint8Array>,
  filename: string,
  type?: string
) {
  if (!data || !filename) return null;

  const chunks = [];
  for await (const chunk of data) {
    chunks.push(chunk);
  }

  return new File(chunks, filename, { type });
}

export function getPublicFileURL(filePath: string, bucketName: string) {
  const { data: url } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return url?.publicURL;
}

export interface UploadOptions {
  bucketName?: string;
  filePath: string;
  filename: string;
  contentType: string;
}

export async function uploadFile(
  data: AsyncIterable<Uint8Array>,
  { filename, contentType, filePath, bucketName = "public" }: UploadOptions
) {
  const file = await convertToFile(data, filename, contentType);

  if (!file) return null;

  const { data: result, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, file);

  if (!result || error) return null;

  return getPublicFileURL(filePath, bucketName);
}
