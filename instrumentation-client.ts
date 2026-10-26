import posthog from "posthog-js";

// Records website visits with PostHog (session replay, heatmaps, rage and dead
// clicks). Off when no key is set, on /admin so the team's own use doesn't
// show up in recordings, and on the unsubscribe page so its token stays private.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const skip = ["/admin", "/newsletter/unsubscribe"].some((p) => window.location.pathname.startsWith(p));

if (key && !skip) {
  posthog.init(key, {
    // Sent through our own domain (see next.config.ts) so ad blockers don't drop it.
    api_host: "/ingest",
    ui_host: (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(
      ".i.posthog.com",
      ".posthog.com",
    ),
    defaults: "2026-08-30",
  });
}
