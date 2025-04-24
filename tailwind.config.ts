import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* Calendar styles */
      gridTemplateColumns: {
        'calendar': 'repeat(7, minmax(0, 1fr))',
      },
      minHeight: {
        'calendar': '300px',
      },
      fontFamily: {
        sans: ["Poppins", ...fontFamily.sans],
      },
      backgroundColor: {
        'page': {
          DEFAULT: '#F5F5F0',
          dark: 'hsl(215 28% 17%)'  /* #1F2937 */
        },
        'menu': {
          DEFAULT: 'hsl(var(--muted))',
          dark: 'hsl(215 28% 23%)'  /* #2D3748 */
        }
      },
      colors: {
        gray: {
          DEFAULT: "hsl(var(--muted))",
          light: "hsl(var(--background))",
        },
        utilization: {
          low: "hsl(346 87% 48%)",    /* #E11D48 */
          medium: "hsl(24 68% 47%)",   /* #C05621 */
          good: "hsl(178 58% 44%)",    /* #2C7A7B */
          optimal: "hsl(175 47% 55%)", /* #4DB6AC */
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        placeholder: "hsl(var(--placeholder))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;