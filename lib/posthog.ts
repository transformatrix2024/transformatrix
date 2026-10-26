// Reads session recordings from PostHog's private API for the admin.
// Needs a personal API key with the session_recording:read and person:read scopes.

export type Recording = {
  id: string;
  distinct_id: string;
  start_time: string;
  end_time: string;
  recording_duration: number; // seconds
  active_seconds?: number;
  click_count?: number;
  keypress_count?: number;
  console_error_count?: number;
  start_url?: string;
  viewed?: boolean;
  person?: {
    name?: string;
    distinct_ids?: string[];
    properties?: Record<string, unknown>;
  };
};

type Config = { apiKey: string; projectId: string; appHost: string };

export function posthogConfig(): Config | null {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  // The capture host (us.i.posthog.com) differs from the app/API host (us.posthog.com).
  const ingest = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  return { apiKey, projectId, appHost: ingest.replace(".i.posthog.com", ".posthog.com") };
}

async function get<T>(config: Config, path: string, params: Record<string, string>) {
  const url = new URL(`/api/projects/${config.projectId}${path}`, config.appHost);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `PostHog returned HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const RECORDINGS_PAGE_SIZE = 25;

export async function listRecordings(
  config: Config,
  { days, person, offset }: { days: number; person?: string; offset: number },
) {
  const params: Record<string, string> = {
    limit: String(RECORDINGS_PAGE_SIZE),
    offset: String(offset),
    date_from: `-${days}d`,
  };

  if (person) {
    // Find the person by email, name or id, then filter recordings to them.
    const people = await get<{ results: { id?: string; uuid?: string }[] }>(config, "/persons/", {
      search: person,
    });
    const match = people.results[0];
    if (!match) return { results: [] as Recording[], hasNext: false, personFound: false };
    params.person_uuid = match.uuid ?? match.id ?? "";
  }

  const data = await get<{ results: Recording[]; has_next: boolean }>(
    config,
    "/session_recordings/",
    params,
  );
  return { results: data.results, hasNext: data.has_next, personFound: true };
}

export function recordingUrl(config: Config, id: string) {
  return `${config.appHost}/project/${config.projectId}/replay/${id}`;
}

export function recordingPerson(recording: Recording) {
  const props = recording.person?.properties ?? {};
  const email = typeof props.email === "string" ? props.email : undefined;
  return email ?? recording.person?.name ?? recording.distinct_id;
}
