import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { getEvent } from "@/lib/events";
import { storageConfigured } from "@/lib/storage";
import { deleteEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata = { title: "Event details" };

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const event = await getEvent((await params).id);
  if (!event) notFound();

  return (
    <div className="flex flex-col gap-6">
      <EventForm event={event} uploadsEnabled={storageConfigured()} />
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Delete event</CardTitle>
          <CardDescription>
            Only possible before anyone registers. After that, set the status to Cancelled instead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmAction
            trigger={
              <Button variant="destructive">
                <Trash2 /> Delete event
              </Button>
            }
            title="Delete this event?"
            description="Its ticket types and offers are deleted too. This can't be undone."
            confirmLabel="Delete event"
            destructive
            action={deleteEvent.bind(null, event.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
