// Blog categories from the sitemap. Posts will come from the admin; until
// then only the post shown on the landing page exists, with placeholder text.

export const CATEGORIES = [
  "Integration",
  "Journaling",
  "Quantum",
  "Women",
  "Young minds",
  "Channeling",
] as const;

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: (typeof CATEGORIES)[number];
  tags: string[];
  relatedProgram: string; // program slug for the card at the end of the post
};

export const POSTS: Post[] = [
  {
    slug: "why-inner-work-needs-integration-not-intensity",
    title: "Why Inner Work Needs Integration, Not Intensity",
    excerpt: "Why Inner Work Needs Integration, Not Intensity.",
    category: "Integration",
    tags: ["Reflection", "Inner Work"],
    relatedProgram: "she-rises",
  },
];

export function categorySlug(category: string) {
  return category.toLowerCase().replace(/\s+/g, "-");
}
