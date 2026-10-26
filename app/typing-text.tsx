"use client";

import { useEffect, useState } from "react";

const START_DELAY_MS = 400;
const CHAR_DELAY_MS = 90;

export default function TypingText({ text }: { text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= text.length) return;

    // Skip the animation for people who asked for less motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }

    const id = setTimeout(
      () => setCount(count + 1),
      count === 0 ? START_DELAY_MS : CHAR_DELAY_MS,
    );
    return () => clearTimeout(id);
  }, [count, text]);

  return (
    <h1 className="headline">
      {/* Full text for screen readers and search engines; the typed copy is visual only. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span className="cursor" aria-hidden="true" />
    </h1>
  );
}
