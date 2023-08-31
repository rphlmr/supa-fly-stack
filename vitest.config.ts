/// <reference types="vitest" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./test/setup-test-env.ts"],
		includeSource: ["app/**/*.{js,ts}"],
		exclude: ["node_modules", "mocks/**/*.{js,ts}"],
		coverage: {
			reporter: ["text", "json", "html"],
			include: ["app/**/*.{js,ts}"],
			all: true,
		},
	},
});
