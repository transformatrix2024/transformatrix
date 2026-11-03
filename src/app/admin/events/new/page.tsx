import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/server/auth/require-admin";
import { storageConfigured } from "@/server/integrations/supabase-storage";
import { EventForm } from "../event-form";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="New event"
        back={{ href: "/admin/events", label: "Events" }}
        description="Add the details first; you'll set ticket prices and offers next."
      />
      <EventForm uploadsEnabled={storageConfigured()} />
    </>
  );
}
