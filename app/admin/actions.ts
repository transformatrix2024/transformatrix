"use server";

import { requireAdmin } from "@/lib/admin";
import { createSignedImageUpload, storageConfigured } from "@/lib/storage";

const FOLDERS = ["posts", "events", "newsletter"] as const;

// Step 1 of an image upload: a one-time URL the browser uploads the file to.
export async function createImageUpload(folder: (typeof FOLDERS)[number], filename: string) {
  await requireAdmin();
  if (!storageConfigured()) {
    return { error: "Image uploads need the Supabase URL and keys to be set." };
  }
  if (!FOLDERS.includes(folder)) return { error: "Unknown upload folder." };
  try {
    return await createSignedImageUpload(folder, filename);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not prepare the upload." };
  }
}
