// SAMPLE dates so the calendar can be designed and reviewed. Replace with
// real published events from the admin before launch; the calendar shows a
// "Sample dates" note while these are in use.

export const FORMATS = ["Online", "Immersion", "Retreat", "Workshop"] as const;
export type Format = (typeof FORMATS)[number];

export type UpcomingDate = {
  id: string;
  program: string; // program slug
  title: string;
  format: Format;
  start: string; // ISO with offset
  end?: string;
  place: string;
};

export const USING_SAMPLE_DATES = true;

export const UPCOMING_DATES: UpcomingDate[] = [
  { id: "ink-l1-nov", program: "ink-within", title: "The INK Within® · Level 1", format: "Online", start: "2026-11-08T10:00:00+05:30", place: "Online" },
  { id: "she-rises-online-nov", program: "she-rises", title: "She Rises · Online circle", format: "Online", start: "2026-11-12T18:30:00+05:30", place: "Online" },
  { id: "brighter-minds-nov", program: "brighter-minds", title: "Brighter Minds® · Children", format: "Workshop", start: "2026-11-15T11:00:00+05:30", place: "Venue to be announced" },
  { id: "she-rises-immersion-nov", program: "she-rises", title: "She Rises · Immersion", format: "Immersion", start: "2026-11-21T10:00:00+05:30", end: "2026-11-23T17:00:00+05:30", place: "Venue to be announced" },
  { id: "quantum-l1-nov", program: "quantum-resonance", title: "Quantum Resonance · Level 1", format: "Workshop", start: "2026-11-28T10:00:00+05:30", place: "Online" },
  { id: "ink-work-dec", program: "ink-within", title: "The INK Within® @ Work", format: "Workshop", start: "2026-12-05T09:30:00+05:30", place: "Venue to be announced" },
  { id: "signal-dec", program: "signal-within", title: "The SIGNAL Within®", format: "Online", start: "2026-12-13T18:00:00+05:30", place: "Online" },
  { id: "she-rises-online-dec", program: "she-rises", title: "She Rises · Online circle", format: "Online", start: "2026-12-17T18:30:00+05:30", place: "Online" },
  { id: "she-rises-retreat-jan", program: "she-rises", title: "She Rises · Retreat", format: "Retreat", start: "2027-01-15T15:00:00+05:30", end: "2027-01-18T12:00:00+05:30", place: "Venue to be announced" },
];
