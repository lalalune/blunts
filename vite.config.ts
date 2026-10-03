import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "app/client",
  plugins: [react()],
  build: { outDir: "../../dist", emptyOutDir: true },
});
