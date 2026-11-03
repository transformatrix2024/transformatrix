import { Plus } from "lucide-react";
import { FAQ } from "@/content/people";

// Grey accordion bars from the design; answers are still to be written.
export function FaqList() {
  return (
    <div className="flex flex-col gap-3">
      {FAQ.map((question) => (
        <details key={question} className="group rounded-sm bg-tm-card">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
            {question}
            <Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" />
          </summary>
          <p className="px-4 pb-4 text-sm text-black/60">The answer is coming soon.</p>
        </details>
      ))}
    </div>
  );
}
