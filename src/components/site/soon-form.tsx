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
      <div className={cn("flex gap-1.5 sm:gap-2", layout === "inline" ? "flex-row" : "flex-col")}>
        {children}
        <button
          type="submit"
          className="h-7 w-fit shrink-0 rounded-md bg-tm-ink px-2.5 text-[11px] font-medium whitespace-nowrap text-white hover:bg-black/75 sm:h-9 sm:px-3.5 sm:text-[13px]"
        >
          {button}
        </button>
      </div>
      <p role="status" className="min-h-5 text-[10px] text-black/60 sm:text-xs">
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
        "h-7 w-full rounded-md border border-black/10 bg-white px-2 text-[11px] outline-none placeholder:text-black/40 focus:border-black/40 sm:h-9 sm:px-3 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
