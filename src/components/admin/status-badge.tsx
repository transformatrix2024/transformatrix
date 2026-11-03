import { cn } from "@/lib/utils";

const TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  gray: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
} as const;

const STATUS: Record<string, { label: string; tone: keyof typeof TONES }> = {
  // posts / events
  draft: { label: "Draft", tone: "gray" },
  published: { label: "Published", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
  // campaigns
  sending: { label: "Sending", tone: "blue" },
  sent: { label: "Sent", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  // subscribers
  subscribed: { label: "Subscribed", tone: "green" },
  unsubscribed: { label: "Unsubscribed", tone: "gray" },
  // registrations
  pending: { label: "Awaiting payment", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  refunded: { label: "Refunded", tone: "gray" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { label, tone } = STATUS[status] ?? { label: status, tone: "gray" as const };
  return <Pill tone={tone} className={className}>{label}</Pill>;
}

export function Pill({
  tone = "gray",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
