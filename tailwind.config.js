/** @type {import('tailwindcss').Config} */
// MADMEN — "Noir & Or" : socle de tokens premium, thème sombre executive.
// Fond noir profond, surfaces graphite, accent or signature (#F4C430). Abandon de l'indigo.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Accent de marque (OR) — CTA, nav active, liens, focus, données clés.
        // brand-600 = or signature (#F4C430). Échelle pensée pour fond sombre.
        brand: {
          50: "#1a1710",
          100: "#2a2513",
          200: "#3f3719",
          300: "#6b581f",
          400: "#c9a227",
          500: "#f6ce4d",
          600: "#f4c430", // or signature — CTA / accents
          700: "#d9a521", // hover CTA
          800: "#a87e18",
          900: "#6e520f",
        },
        // Surfaces & fond app (noir → graphite)
        canvas: "#0f0f10", // fond application
        surface: "#1d1d1d", // cartes / panneaux
        "surface-2": "#262626", // surfaces surélevées / hover
        // Bordures (mappées sur les variables CSS pour cohérence)
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        // Échelle d'encre / texte (inversée pour le dark : clair sur sombre)
        ink: "#fafafa", // titres / texte fort
        texte: "#ededed", // texte courant
        muted: "#9a9a9a", // texte secondaire
        subtle: "#6f6f6f", // labels / placeholders
        faint: "#4a4a4a", // texte très discret / séparateurs
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        kicker: "0.12em",
      },
      borderRadius: {
        lg: "0.625rem", // 10px — boutons & inputs
        xl: "0.75rem", // 12px — pastilles d'icône
        "2xl": "1rem", // 16px — cartes
      },
      maxWidth: {
        content: "1440px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5)",
        card: "0 1px 2px rgba(0,0,0,0.45), 0 8px 24px -8px rgba(0,0,0,0.6)",
        lift: "0 12px 32px -10px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
        pop: "0 24px 60px -16px rgba(0,0,0,0.75)",
        focus: "0 0 0 3px rgba(244,196,48,0.30)",
        glow: "0 0 0 1px rgba(244,196,48,0.25), 0 8px 28px -8px rgba(244,196,48,0.25)",
      },
    },
  },
  plugins: [],
};
