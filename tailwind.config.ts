import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2F7F2",
        card: "#FFFFFF",
        sand: "#E3EDE3",
        moss: "#15803D",
        ink: "#1F2A22",
        muted: "#55685A"
      },
      borderRadius: { xl2: "14px" }
    }
  },
  plugins: []
};
export default config;
