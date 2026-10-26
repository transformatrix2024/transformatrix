export const NEWSLETTER_TABS = [
  { href: "/admin/newsletter", label: "Issues", exact: true },
  { href: "/admin/newsletter/subscribers", label: "Subscribers" },
];

// A send that has been "sending" this long was interrupted (e.g. a timeout)
// and may be resumed.
export const STALE_SEND_MS = 10 * 60 * 1000;
