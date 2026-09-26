import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F2ED",
        card: "#FBFAF7",
        sand: "#ECE9E2",
        moss: "#4A5D4E",
        ink: "#2B2926",
        muted: "#6E675C"
      },
      borderRadius: { xl2: "14px" }
    }
  },
  plugins: []
};
export default config;
