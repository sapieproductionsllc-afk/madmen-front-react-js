/** @type {import('tailwindcss').Config} */
// MADMEN — "Crème & Canard" : identité officielle de la marque.
// Fond crème, accent bleu canard (#1A535C), taupe secondaire (#D2BE9B), texte anthracite (#1E1E1E).
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Accent de marque — BLEU CANARD officiel. brand-600 = #1A535C (CTA, nav active, liens, focus).
        brand: {
          50: "#e9f1f2",
          100: "#cfe0e2",
          200: "#a6c6ca",
          300: "#73a4ab",
          400: "#458088",
          500: "#266b75",
          600: "#1a535c", // bleu canard signature
          700: "#143f47", // hover / pressé
          800: "#0f3036",
          900: "#0a2226",
        },
        // Surfaces & fond
        canvas: "#f7f4e9", // crème (fond général)
        surface: "#ffffff", // cartes / panneaux
        "surface-2": "#f0ead9", // surfaces surélevées / hover / en-têtes doux
        // OR / doré signature — couleur d'ACTION dominante (CTA, KPI, menu actif, actions importantes).
        or: {
          50: "#fbf6e9",
          100: "#f5e9c6",
          200: "#ecd596",
          300: "#e2bd5e",
          400: "#d6a534",
          500: "#c8941f", // doré signature
          600: "#a8791a",
          700: "#855e18",
          800: "#6b4c19",
          900: "#5a4019",
        },
        // Taupe officiel (accents chauds : en-têtes de tableau, blocs secondaires, badges)
        sand: "#d2be9b",
        "sand-soft": "#e7dcc4",
        // Bordures (mappées sur variables CSS)
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        // Échelle d'encre / texte (anthracite chaud)
        ink: "#1e1e1e", // titres / texte fort
        texte: "#33312c", // texte courant
        muted: "#6e685c", // secondaire
        subtle: "#938b7a", // labels / placeholders
        faint: "#b9af9a", // discret / séparateurs
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
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
        soft: "0 1px 2px rgba(30,30,30,0.04), 0 1px 3px rgba(30,30,30,0.06)",
        card: "0 1px 2px rgba(30,30,30,0.04), 0 4px 16px -6px rgba(30,30,30,0.08)",
        lift: "0 12px 28px -10px rgba(26,83,92,0.20), 0 2px 8px rgba(30,30,30,0.06)",
        pop: "0 20px 50px -16px rgba(30,30,30,0.22)",
        focus: "0 0 0 3px rgba(26,83,92,0.22)",
        glow: "0 0 0 1px rgba(26,83,92,0.18), 0 10px 30px -8px rgba(26,83,92,0.22)",
      },
    },
  },
  plugins: [],
};
