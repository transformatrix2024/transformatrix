import { notFound } from "next/navigation";
import { LinkTabs } from "@/components/admin/link-tabs";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import { eventPlace, getEvent } from "@/lib/events";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const place = eventPlace(event);

  return (
    <>
      <PageHeader
        title={event.title}
        back={{ href: "/admin/events", label: "Events" }}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={event.status} />
            <span>{formatDateTime(event.startsAt, event.timezone)}</span>
            {place && <span>· {place}</span>}
          </span>
        }
      />
      <LinkTabs
        className="mb-6"
        tabs={[
          { href: `/admin/events/${event.id}/participants`, label: "Participants" },
          { href: `/admin/events/${event.id}/pricing`, label: "Pricing & offers" },
          { href: `/admin/events/${event.id}`, label: "Details", exact: true },
        ]}
      />
      {children}
    </>
  );
}
