import { Plus } from "lucide-react";
import { FAQ } from "@/content/people";

// Grey accordion bars from the design; answers are still to be written.
export function FaqList() {
  return (
    <div className="flex flex-col gap-3">
      {FAQ.map((question) => (
        <details key={question} className="group rounded-sm bg-tm-card">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-[13px] font-medium sm:min-h-14 sm:gap-4 sm:px-4 sm:py-3 sm:text-[15px] [&::-webkit-details-marker]:hidden">
            {question}
            <Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" />
          </summary>
          <p className="px-3 pb-3 text-[13px] text-black/60 sm:px-4 sm:pb-4 sm:text-sm">The answer is coming soon.</p>
        </details>
      ))}
    </div>
  );
}
