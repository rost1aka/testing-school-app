"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Switches between the light and the dark theme and remembers the choice.
 *
 * Until someone chooses, there is no stored theme and the page follows the
 * operating system — which is why the effect reads `matchMedia` rather than
 * assuming light. The theme itself is applied by the inline script in the root
 * layout, before the first paint; this control only changes it afterwards.
 */
export function ThemeToggle() {
  // Null until mounted: the server cannot know which theme the reader is on,
  // so the button renders at its final size with no glyph rather than
  // rendering the wrong one and correcting it a moment later.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // A browser refusing storage still gets the theme for this page.
    }
  }

  const label =
    theme === null
      ? "Switch theme"
      : theme === "dark"
        ? "Switch to the light theme"
        : "Switch to the dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === "dark"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm text-text transition-colors hover:text-accent"
    >
      <span aria-hidden="true">{theme === null ? "" : theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
