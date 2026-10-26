import { createClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "./storage-bucket";

// Images live in a public Supabase Storage bucket. The browser uploads
// straight to Supabase with a one-time signed URL, so large files don't pass
// through (and hit the size limits of) our server.

export function storageConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SECRET_KEY,
  );
}

function adminStorage() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage;
}

export async function createSignedImageUpload(folder: string, filename: string) {
  const ext = (filename.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const path = `${folder}/${crypto.randomUUID()}.${ext || "jpg"}`;
  const storage = adminStorage();

  let { data, error } = await storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error && /not found/i.test(error.message)) {
    // First upload ever: create the bucket.
    await storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/*"],
    });
    ({ data, error } = await storage.from(MEDIA_BUCKET).createSignedUploadUrl(path));
  }
  if (error || !data) throw new Error(error?.message ?? "Could not prepare the upload.");

  const publicUrl = storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  return { path, token: data.token, publicUrl };
}
