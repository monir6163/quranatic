/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: "#132420",
        canvas: "#FBF7EF",
        panel: "#FFFFFF",
        primary: {
          50: "#EAF4EF",
          100: "#CFE6D8",
          200: "#9FCDB2",
          300: "#6FB48C",
          400: "#3F9B66",
          500: "#1F7A4D",
          600: "#175E3B",
          700: "#12492E",
          800: "#0D3521",
          900: "#082014"
        },
        gold: {
          50: "#FBF3E2",
          100: "#F3E0B4",
          200: "#E8C97E",
          300: "#DDB350",
          400: "#C89B3C",
          500: "#AC7F28",
          600: "#8B651F"
        },
        clay: "#B15B45"
      },
      fontFamily: {
        display: ["'Noto Serif Bengali'", "serif"],
        body: ["'Hind Siliguri'", "sans-serif"]
      },
      boxShadow: {
        soft: "0 8px 30px -8px rgba(19,36,32,0.18)",
        card: "0 2px 14px rgba(19,36,32,0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(24px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        floatSlow: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.8s ease forwards",
        floatSlow: "floatSlow 5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite"
      }
    }
  },
  plugins: []
};
