import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Slate-based neutral ramp plus one accent (indigo) and status
        // colors (danger/success). Every component pulls colour from these
        // names rather than raw Tailwind palette values, so the whole app's
        // palette can be swapped by editing this block alone.
        surface: "#ffffff",
        "surface-muted": "#f1f5f9",
        border: "#cbd5e1",
        text: "#0f172a",
        "text-muted": "#64748b",
        accent: "#4f46e5",
        "accent-hover": "#4338ca",
        danger: "#dc2626",
        success: "#16a34a",
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.06), 0 1px 3px 0 rgb(15 23 42 / 0.1)",
        focus: "0 0 0 3px rgb(79 70 229 / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
