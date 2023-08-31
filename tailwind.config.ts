import type { Config } from "tailwindcss";

export default {
	content: ["./app/**/*.{ts,tsx,jsx,js}"],
	theme: {
		extend: {},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
		require("tailwind-scrollbar"),
	],
} satisfies Config;
