import type { Config } from "tailwindcss";
import tailwindcssAnimate from 'tailwindcss-animate';
const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        grotesk: ["var(--font-grotesk)", "sans-serif"],
        dm: ["var(--font-dm)", "sans-serif"],
      },
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Role identity colors (SPEC values, not the design repo's hexes):
  			// Brand Navy #1e3a8a, Agency uses Tailwind emerald-600 #059669,
  			// Influencer Coral #f87171. -50 tints are the matching pale surfaces.
  			role: {
  				navy: { '50': '#eff6ff', DEFAULT: '#1e3a8a' },
  				coral: { '50': '#fef2f2', DEFAULT: '#f87171' }
  			},
  			// Decorative per-section nav accent ramps (theme-independent brand tones).
  			nav: {
  				bronze: { '100': '#F5E8D4', '200': '#E5CFA0', '800': '#735510', '900': '#8B6914' },
  				teal:   { '100': '#D4ECEC', '200': '#A8D4D4', '800': '#0B4343', '900': '#0D4F4F' },
  				brown:  { '100': '#EDE4DC', '200': '#D4C0B0', '800': '#4A3429', '900': '#5C4033' },
  				ocean:  { '100': '#D6EBF5', '200': '#A8D4EB', '800': '#005A80', '900': '#006994' },
  				burnt:  { '100': '#F5DFCC', '200': '#E8C4A0', '800': '#B84A00', '900': '#CC5500' },
  				forest: { '100': '#D9E8DC', '200': '#A8D4B8', '800': '#1E7A1E', '900': '#228B22' }
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [tailwindcssAnimate]
};

export default config;
