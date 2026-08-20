import type { Config } from "tailwindcss";

/**
 * Every colour resolves to a custom property defined in app/globals.css, one
 * set per theme. The `<alpha-value>` placeholder is what lets `bg-danger/10`
 * and `border-accent/30` keep working — Tailwind substitutes the opacity into
 * the `rgb()` call, which a bare `var(--token)` holding a hex string could not
 * do.
 */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The ground the page sits on. Behind `surface` in the dark theme, the
        // same white as it in the light one.
        canvas: token("canvas"),
        surface: token("surface"),
        "surface-muted": token("surface-muted"),
        border: token("border"),
        text: token("text"),
        "text-muted": token("text-muted"),
        accent: token("accent"),
        "accent-hover": token("accent-hover"),
        // Text that sits on top of a solid accent or danger fill. White in the
        // light theme; near-black in the dark one, where those fills lighten.
        "accent-foreground": token("accent-foreground"),
        danger: token("danger"),
        "danger-foreground": token("danger-foreground"),
        success: token("success"),
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.06), 0 1px 3px 0 rgb(15 23 42 / 0.1)",
        focus: "0 0 0 3px rgb(var(--color-accent) / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
