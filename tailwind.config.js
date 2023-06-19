/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "Inter"]
      },
      colors: {
        primary: "#118df0",
        secondary: "#0e2f56",
        offwhite: "#ececda"
      }
    }
  },
  plugins: []
};
