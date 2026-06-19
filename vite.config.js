import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuration Vite — base "./" pour faciliter un futur empaquetage APK (Capacitor)
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
