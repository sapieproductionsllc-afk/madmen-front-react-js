/** @type {import('tailwindcss').Config} */
// Thème clair moderne — fond doux, blanc, accent indigo + couleurs de statut vives.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Accent de marque (indigo) — facile à réutiliser
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        canvas: "#f5f6f8",
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        kicker: "0.14em",
      },
      maxWidth: {
        content: "1440px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        lift: "0 8px 24px -8px rgba(16,24,40,0.12), 0 2px 6px rgba(16,24,40,0.05)",
      },
    },
  },
  plugins: [],
};
