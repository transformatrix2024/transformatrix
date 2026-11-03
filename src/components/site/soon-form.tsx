"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// A form whose backend isn't connected yet. Submitting says so plainly
// instead of pretending the details were saved.
export function SoonForm({
  button,
  children,
  className,
  layout = "inline",
}: {
  button: string;
  children: React.ReactNode;
  className?: string;
  layout?: "inline" | "stacked";
}) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className={cn("flex flex-col gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className={cn("flex gap-2", layout === "inline" ? "flex-col sm:flex-row" : "flex-col")}>
        {children}
        <button
          type="submit"
          className="h-9 w-fit shrink-0 rounded-md bg-tm-ink px-3.5 text-[13px] font-medium whitespace-nowrap text-white hover:bg-black/75"
        >
          {button}
        </button>
      </div>
      <p role="status" className="min-h-5 text-xs text-black/60">
        {submitted && "Thanks! This form isn't connected yet. It goes live when the site launches."}
      </p>
    </form>
  );
}

export function SoonInput({ label, className, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return (
    <input
      aria-label={label}
      placeholder={label}
      className={cn(
        "h-9 w-full rounded-md border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-black/40 focus:border-black/40",
        className,
      )}
      {...props}
    />
  );
}
