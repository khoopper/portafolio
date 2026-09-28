import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        win: {
          text: "#1e1e1e",
          muted: "#5a6270",
          heading: "#1e3287",
          link: "#0066cc",
          navpane: "#f1f5fb",
          border: "#a0afc3",
          select: "#7da2ce",
        },
      },
      fontFamily: {
        ui: ["Segoe UI", "Segoe UI Web (West European)", "Tahoma", "system-ui", "sans-serif"],
      },
    },
  },
  // "class" strategy: forms plugin only styles elements that opt in (admin forms in Phase 3).
  plugins: [forms({ strategy: "class" })],
};

export default config;
