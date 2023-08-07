/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/preline/dist/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "Inter"]
      },
      colors: {
        text: "#fafafa",
        background: "#121212",
        primary: "#118df0",
        secondary: "#0e2f56",
        accent: "#fdfdfd"
      },
      fontSize: {
        text: "0.778rem",
        base: "1rem",
        title: "1.778rem"
      }
    }
  },
  plugins: [require("preline/plugin")]
};
