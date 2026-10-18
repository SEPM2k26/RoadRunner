/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFDF5',    // Warm Cream/Off-White paper feel
        foreground: '#1E293B',    // Slate 800
        muted: '#F1F5F9',         // Slate 100
        mutedForeground: '#64748B',// Slate 500
        accent: {
          DEFAULT: '#8B5CF6',     // Vivid Violet
          foreground: '#FFFFFF',
          hover: '#7C3AED',
        },
        secondary: {
          DEFAULT: '#F472B6',     // Hot Pink
          foreground: '#FFFFFF',
          hover: '#EC4899',
        },
        tertiary: {
          DEFAULT: '#FBBF24',     // Amber/Yellow
          foreground: '#1E293B',
          hover: '#F59E0B',
        },
        quaternary: {
          DEFAULT: '#34D399',     // Emerald/Mint
          foreground: '#1E293B',
          hover: '#10B981',
        },
        border: '#1E293B',        // Slate 800 dark border
        card: '#FFFFFF',
      },
      fontFamily: {
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'pop-xs': '2px 2px 0px 0px #1E293B',
        'pop': '4px 4px 0px 0px #1E293B',
        'pop-md': '6px 6px 0px 0px #1E293B',
        'pop-lg': '8px 8px 0px 0px #1E293B',
        'pop-hover': '6px 6px 0px 0px #1E293B',
        'pop-active': '2px 2px 0px 0px #1E293B',
        // Colorful pop shadows
        'pop-pink': '5px 5px 0px 0px #F472B6',
        'pop-yellow': '5px 5px 0px 0px #FBBF24',
        'pop-violet': '5px 5px 0px 0px #8B5CF6',
        'pop-mint': '5px 5px 0px 0px #34D399',
      },
      borderRadius: {
        'leaf': '24px 24px 24px 0px',
        'leaf-reverse': '24px 24px 0px 24px',
        'arch': '9999px 9999px 0px 0px',
      },
      transitionTimingFunction: {
        'bounce-pop': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
