import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "katex", test: /node_modules\/katex/ },
            { name: "motion", test: /node_modules\/(motion|framer-motion)/ },
            {
              name: "react",
              test: /node_modules\/(react|react-dom|scheduler)/,
            },
          ],
        },
      },
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
