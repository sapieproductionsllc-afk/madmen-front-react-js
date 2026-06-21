/** @type {import('tailwindcss').Config} */
// MADMEN — thème « Vert sapin & Crème ». Sidebar vert sapin, fond crème, accent OR.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Accent de marque — VERT SAPIN. brand-600 = #1f4a3a (bandeau, CTA, liens, focus).
        brand: {
          50: "#eef3f1",
          100: "#d3e0db",
          200: "#a7c2b8",
          300: "#6f9c8d",
          400: "#3f7363",
          500: "#2a5a48",
          600: "#1f4a3a", // haut du dégradé bandeau
          700: "#173228", // bas du dégradé / hover foncé
          800: "#102620",
          900: "#0b1a16",
        },
        // Sidebar dédiée (distincte du bandeau)
        sidebar: "#1c3a30",
        "sidebar-hover": "#274b40",
        // OR / doré signature — couleur d'ACTION (CTA, KPI, menu actif).
        or: {
          50: "#faf3e3",
          100: "#f1e0bb",
          200: "#e6c98a",
          300: "#d9af57",
          400: "#cb9b3c",
          500: "#b8882a", // OR signature
          600: "#9c7122",
          700: "#7d591c",
          800: "#634718",
          900: "#523b16",
        },
        // Surfaces & fond
        canvas: "#f4f0e7", // crème
        surface: "#ffffff",
        "surface-2": "#faf7f0",
        sand: "#d8cdb6",
        "sand-soft": "#ece4d3",
        // Bordures (variables CSS)
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        hairline: "var(--hairline)",
        // Encre / texte
        ink: "#1f2a25",
        texte: "#2c3a33",
        muted: "#5d6b63",
        subtle: "#97a096",
        faint: "#b9c1b8",
        // Statuts (alignés sur le brief — deep-merge avec les palettes Tailwind)
        emerald: { 50: "#e7f5ee", 400: "#3bb079", 500: "#1f9d63", 600: "#1a854f", 700: "#176b42" },
        rose: { 50: "#fbeae5", 400: "#e07a66", 500: "#d9614b", 600: "#c14e3a", 700: "#9e3e2e" },
        sky: { 50: "#e9f0fa", 400: "#5b92d2", 500: "#3f7cc4", 600: "#356bab", 700: "#2b568a" },
        amber: { 50: "#fdf1e3", 400: "#e69633", 500: "#d97f1e", 600: "#b5651a", 700: "#8c4e16" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Bricolage Grotesque", "Inter", "system-ui", "sans-serif"],
        mono: ["Inter", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        kicker: "0.12em",
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      maxWidth: {
        content: "1440px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,42,37,0.04), 0 1px 3px rgba(31,42,37,0.06)",
        card: "0 1px 2px rgba(31,42,37,0.04), 0 4px 16px -6px rgba(31,42,37,0.08)",
        lift: "0 12px 28px -10px rgba(31,74,58,0.20), 0 2px 8px rgba(31,42,37,0.06)",
        pop: "0 20px 50px -16px rgba(31,42,37,0.22)",
        focus: "0 0 0 3px rgba(31,74,58,0.22)",
        glow: "0 0 0 1px rgba(31,74,58,0.18), 0 10px 30px -8px rgba(31,74,58,0.22)",
      },
    },
  },
  plugins: [],
};
