/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Simplified syntax (["class"] is also valid but unnecessary)
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',  /* #F5F5F0 in light, #2D3748 in dark */
        foreground: 'hsl(var(--foreground))',  /* #374151 in light, #E5E7EB in dark */
        
        primary: {
          DEFAULT: 'hsl(var(--primary))',  /* #2C7A7B in light, #4DB6AC in dark */
          foreground: 'hsl(var(--primary-foreground))',  /* #FFFFFF in light, #000000 in dark */
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',  /* #C05621 */
          foreground: 'hsl(var(--secondary-foreground))',  /* #FFFFFF */
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',  /* #2C7A7B in light, #4DB6AC in dark */
          foreground: 'hsl(var(--accent-foreground))',  /* #000000 */
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',  /* #E11D48 */
          foreground: 'hsl(var(--destructive-foreground))',  /* #FFFFFF */
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',  /* #D1D5DB in light, #4B5563 in dark */
          foreground: 'hsl(var(--muted-foreground))',  /* #6B7280 in light, #9CA3AF in dark */
        },
        card: {
          DEFAULT: 'hsl(var(--card))',  /* #FFFFFF in light, #2D3748 in dark */
          foreground: 'hsl(var(--card-foreground))',  /* #374151 in light, #E5E7EB in dark */
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',  /* #FFFFFF in light, #2D3748 in dark */
          foreground: 'hsl(var(--popover-foreground))',  /* #374151 in light, #E5E7EB in dark */
        },
        border: 'hsl(var(--border))',  /* #D1D5DB in light, #4B5563 in dark */
        input: 'hsl(var(--input))',  /* #374151 in light, #E5E7EB in dark */
        ring: 'hsl(var(--ring))',  /* #2C7A7B in light, #4DB6AC in dark */
        placeholder: {
          DEFAULT: 'hsl(var(--placeholder-text))',  /* #9CA3AF in light, #6B7280 in dark */
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'h1': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'h2': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'small': ['10px', { lineHeight: '14px', fontWeight: '400' }],
        'button': ['12px', { lineHeight: '16px', fontWeight: '600' }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};