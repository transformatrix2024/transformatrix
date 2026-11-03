// Programs from the sitemap. One page per program; levels, formats and
// sister programs are tabs on that page so the menu stays small.

export const FAMILIES = [
  { id: "signature", label: "Signature" },
  { id: "ink", label: "INK Within®" },
  { id: "quantum", label: "Quantum" },
  { id: "minds", label: "Minds" },
  { id: "work", label: "Work with us" },
] as const;

export type FamilyId = (typeof FAMILIES)[number]["id"];

export type Program = {
  slug: string;
  name: string;
  family: FamilyId;
  tagline: string;
  tabs?: { id: string; label: string }[];
  // No dates yet: show "Coming soon" and a waitlist instead of enrolment.
  comingSoon?: boolean;
  note?: string;
};

export const PROGRAMS: Program[] = [
  {
    slug: "she-rises",
    name: "She Rises",
    family: "signature",
    tagline: "A Women's Empowerment & Inner Alignment Experience",
    tabs: [
      { id: "online", label: "Online" },
      { id: "immersion", label: "Immersion" },
      { id: "retreat", label: "Retreat" },
    ],
  },
  {
    slug: "the-rising",
    name: "The Rising",
    family: "signature",
    tagline: "The She Rises journey, open to all genders",
    comingSoon: true,
    note: "Same modules as She Rises, for all genders.",
  },
  {
    slug: "ink-within",
    name: "The INK Within®",
    family: "ink",
    tagline: "Journaling for Reflection & Inner Alignment",
    tabs: [
      { id: "level-1", label: "Level 1" },
      { id: "level-2", label: "Level 2" },
      { id: "at-work", label: "@ Work" },
    ],
  },
  {
    slug: "quantum-resonance",
    name: "Quantum Resonance Practitioner",
    family: "quantum",
    tagline: "Practitioner training in two levels",
    tabs: [
      { id: "level-1", label: "Level 1" },
      { id: "level-2", label: "Level 2" },
    ],
  },
  {
    slug: "signal-within",
    name: "The SIGNAL Within®",
    family: "minds",
    tagline: "Details coming soon",
  },
  {
    slug: "brighter-minds",
    name: "Brighter Minds®",
    family: "minds",
    tagline: "For children, and Restart for adults",
    tabs: [
      { id: "children", label: "Children" },
      { id: "restart", label: "Restart · adults" },
    ],
  },
  {
    slug: "one-to-one",
    name: "1:1 Sessions",
    family: "work",
    tagline: "Private sessions with Nalini or Anjali",
    tabs: [
      { id: "nalini", label: "With Nalini" },
      { id: "anjali", label: "With Anjali" },
    ],
  },
  {
    slug: "speaking",
    name: "Speaking & keynotes",
    family: "work",
    tagline: "For schools, universities and organisations",
    note: "Organisations can also bring The INK Within® @ Work to their teams.",
  },
];

export function getProgram(slug: string) {
  return PROGRAMS.find((p) => p.slug === slug);
}
