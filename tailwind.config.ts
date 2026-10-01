import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F1E7",
        card: "#FFFFFF",
        sand: "#EAE0C6",
        moss: "#0F766E",
        ink: "#232A4D",
        muted: "#5C6470"
      },
      borderRadius: { xl2: "14px" }
    }
  },
  plugins: []
};
export default config;
