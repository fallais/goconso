import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

// Relative base so the build works under https://<user>.github.io/goconso/.
export default defineConfig({
  base: "./",
  plugins: [preact()],
});
