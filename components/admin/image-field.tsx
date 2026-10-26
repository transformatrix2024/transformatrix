"use client";

import { useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createImageUpload } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MEDIA_BUCKET } from "@/lib/storage-bucket";

const MAX_BYTES = 10 * 1024 * 1024;

// Image URL input with an optional "Upload" button (Supabase Storage).
export function ImageField({
  id,
  name,
  defaultValue,
  folder,
  uploadsEnabled,
  invalid,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  folder: "posts" | "events" | "newsletter";
  uploadsEnabled: boolean;
  invalid?: boolean;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > MAX_BYTES) return toast.error("Images must be 10 MB or smaller.");

    setUploading(true);
    try {
      const target = await createImageUpload(folder, file.name);
      if ("error" in target) throw new Error(target.error);
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
      if (error) throw error;
      setUrl(target.publicUrl);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {url && (
        <div className="relative w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
          <img src={url} alt="" className="aspect-video w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={() => setUrl("")}
            aria-label="Remove image"
          >
            <X />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={uploadsEnabled ? "Paste an image URL or upload" : "https://…"}
          aria-invalid={invalid || undefined}
        />
        {uploadsEnabled && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              Upload
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
