import Link from "next/link";
import { ExternalLink, MonitorPlay, Search } from "lucide-react";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader } from "@/components/admin/page-header";
import { Pill } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/dates";
import {
  listRecordings,
  posthogConfig,
  recordingPerson,
  recordingUrl,
  RECORDINGS_PAGE_SIZE,
  type Recording,
} from "@/lib/posthog";

export const metadata = { title: "Recordings" };

const PERIODS = [1, 7, 30, 90];

export default async function RecordingsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; person?: string; offset?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const days = PERIODS.includes(Number(params.days)) ? Number(params.days) : 7;
  const person = params.person?.trim() || undefined;
  const offset = Math.max(0, Number(params.offset) || 0);
  const config = posthogConfig();

  const header = (
    <PageHeader
      title="Session recordings"
      description="Replays of real visits: where people click, scroll, hesitate and get stuck."
    />
  );

  if (!config) {
    return (
      <>
        {header}
        <NotConfigured
          title="Connect PostHog to see recordings"
          description="The website records sessions with PostHog. To list them here, the admin needs read access to your PostHog project."
          vars={[
            { name: "NEXT_PUBLIC_POSTHOG_KEY", hint: "PostHog → Settings → Project → Project API key (phc_…). Turns on recording on the website." },
            { name: "NEXT_PUBLIC_POSTHOG_HOST", hint: "https://us.i.posthog.com or https://eu.i.posthog.com, matching your PostHog region." },
            { name: "POSTHOG_PROJECT_ID", hint: "PostHog → Settings → Project → Project ID (a number)." },
            {
              name: "POSTHOG_PERSONAL_API_KEY",
              hint: "PostHog → Settings → Personal API keys → Create key with the “Session recording: read” and “Person: read” scopes. Mark it Sensitive in Vercel.",
            },
          ]}
        />
      </>
    );
  }

  let data: Awaited<ReturnType<typeof listRecordings>> | null = null;
  let error: string | null = null;
  try {
    data = await listRecordings(config, { days, person, offset });
  } catch (err) {
    error = err instanceof Error ? err.message : "Couldn't load recordings.";
  }

  const link = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { days: days === 7 ? undefined : days, person, offset: undefined, ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, String(value));
    return next.size ? `/admin/recordings?${next}` : "/admin/recordings";
  };

  return (
    <>
      {header}
      <form className="mb-4 flex flex-col gap-2 sm:flex-row" action="/admin/recordings">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="person" defaultValue={person} placeholder="Find a person by email or name" className="pl-8" aria-label="Person" />
        </div>
        <NativeSelect name="days" defaultValue={String(days)} aria-label="Period">
          {PERIODS.map((d) => (
            <NativeSelectOption key={d} value={d}>
              {d === 1 ? "Last 24 hours" : `Last ${d} days`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Show
        </Button>
      </form>

      {error ? (
        <Card>
          <CardContent className="text-sm text-destructive">PostHog said: {error}</CardContent>
        </Card>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MonitorPlay />
              </EmptyMedia>
              <EmptyTitle>No recordings</EmptyTitle>
              <EmptyDescription>
                {person && data && !data.personFound
                  ? `PostHog doesn't know anyone matching “${person}” yet. People are matched once the site identifies them (for example after they register).`
                  : "Recordings appear a few minutes after people visit the website. Make sure session replay is turned on in PostHog."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Person</TableHead>
                <TableHead className="hidden md:table-cell">Started</TableHead>
                <TableHead className="text-right">Length</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Clicks</TableHead>
                <TableHead className="hidden lg:table-cell">First page</TableHead>
                <TableHead className="pr-4">
                  <span className="sr-only">Watch</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((r) => (
                <RecordingRow key={r.id} recording={r} url={recordingUrl(config, r.id)} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {data && (offset > 0 || data.hasNext) && (
        <div className="mt-4 flex justify-between">
          {offset > 0 ? (
            <Button variant="outline" asChild>
              <Link href={link({ offset: Math.max(0, offset - RECORDINGS_PAGE_SIZE) || undefined })}>Newer</Link>
            </Button>
          ) : (
            <span />
          )}
          {data.hasNext && (
            <Button variant="outline" asChild>
              <Link href={link({ offset: offset + RECORDINGS_PAGE_SIZE })}>Older</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}

function RecordingRow({ recording: r, url }: { recording: Recording; url: string }) {
  const errors = r.console_error_count ?? 0;
  return (
    <TableRow>
      <TableCell className="w-full max-w-0 min-w-40 pl-4">
        <p className="truncate font-medium">{recordingPerson(r)}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="md:hidden">{formatDateTime(new Date(r.start_time))}</span>
          {!r.viewed && <Pill tone="blue">New</Pill>}
          {errors > 0 && <Pill tone="red">{errors} error{errors === 1 ? "" : "s"}</Pill>}
        </p>
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">{formatDateTime(new Date(r.start_time))}</TableCell>
      <TableCell className="text-right tabular-nums">
        {duration(r.recording_duration)}
        {r.active_seconds !== undefined && (
          <p className="text-xs text-muted-foreground">{duration(r.active_seconds)} active</p>
        )}
      </TableCell>
      <TableCell className="hidden text-right tabular-nums sm:table-cell">{r.click_count ?? "—"}</TableCell>
      <TableCell className="hidden max-w-0 lg:table-cell">
        <span className="block truncate text-muted-foreground">{pathOf(r.start_url)}</span>
      </TableCell>
      <TableCell className="pr-4 text-right">
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noreferrer">
            Watch <ExternalLink />
          </a>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function duration(seconds: number) {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function pathOf(url?: string) {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}
