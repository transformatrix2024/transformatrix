"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

// Markdown textarea with a Write / Preview toggle.
export function MarkdownEditor({
  id,
  name,
  defaultValue,
  rows = 16,
  invalid,
  placeholder,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background">
      <div className="flex items-center justify-between border-b bg-muted/50 px-2 py-1">
        <div className="flex gap-1" role="tablist" aria-label="Editor mode">
          {(["write", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground capitalize",
                mode === m && "bg-background text-foreground shadow-sm",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="ml-3 hidden min-w-0 truncate text-xs text-muted-foreground sm:inline">
          Markdown: **bold**, # Heading, - list, [link](url), ![image](url)
        </span>
      </div>
      {/* Keep the textarea mounted so its value is always submitted. */}
      <Textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={cn(
          "rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0",
          mode === "preview" && "hidden",
        )}
      />
      {mode === "preview" && (
        <div className="min-h-64 px-4 py-3">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
