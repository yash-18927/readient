import { useEffect, useState } from "react";

const WORDS = ["ready?", "prepared?", "hireable?", "seen?"];
const HOLD = 1800;
const FADE = 350;

/** Crossfades + slides through the cycling headline word. No layout shift. */
export function CyclingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hold = window.setTimeout(() => {
      setVisible(false);
      const swap = window.setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, FADE);
      return () => window.clearTimeout(swap);
    }, HOLD);
    return () => window.clearTimeout(hold);
  }, [index, visible]);

  return (
    <span className="relative inline-block align-top">
      <span aria-hidden className="invisible block">
        hireable?
      </span>
      <span
        className="absolute inset-0 block text-primary"
        style={{
          transition: `opacity ${FADE}ms ease, transform ${FADE}ms ease`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-0.25em)",
        }}
      >
        {WORDS[index]}
      </span>
    </span>
  );
}
