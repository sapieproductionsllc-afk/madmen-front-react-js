import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuration Vite — base "./" pour faciliter un futur empaquetage APK (Capacitor)
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5210, // port dédié MADMEN (5173/5180 utilisés par d'autres projets)
    strictPort: true,
  },
});
