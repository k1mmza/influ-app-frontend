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
        'tv-serif': ["var(--font-serif)", "serif"],
        'tv-body': ["var(--font-tv-body)", "sans-serif"],
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
  			// ── Travelogue theme ("The Traveler's Ledger") ────────────────────
  			// Namespaced under `tv` so it CANNOT collide with the shadcn tokens
  			// above: both systems define primary/secondary/background/surface
  			// with different values. Utilities read `bg-tv-primary`,
  			// `text-tv-on-surface`, etc. Scoped by usage, not by config — only
  			// the (marketing) route group should reference these.
  			//
  			// A second Tailwind config was tried and removed: binding one via
  			// `@config` swaps the config for the whole PostCSS pipeline and
  			// breaks every route. Do not reintroduce that.
  			//
  			// Canonical values + rationale: /design-tokens.md at the repo root.
  			tv: {
  				'background': 'rgb(var(--tv-background) / <alpha-value>)',
  				'error': 'rgb(var(--tv-error) / <alpha-value>)',
  				'error-container': 'rgb(var(--tv-error-container) / <alpha-value>)',
  				'inverse-on-surface': 'rgb(var(--tv-inverse-on-surface) / <alpha-value>)',
  				'inverse-primary': 'rgb(var(--tv-inverse-primary) / <alpha-value>)',
  				'inverse-surface': 'rgb(var(--tv-inverse-surface) / <alpha-value>)',
  				'muted-text': 'rgb(var(--tv-muted-text) / <alpha-value>)',
  				'on-background': 'rgb(var(--tv-on-background) / <alpha-value>)',
  				'on-error': 'rgb(var(--tv-on-error) / <alpha-value>)',
  				'on-error-container': 'rgb(var(--tv-on-error-container) / <alpha-value>)',
  				'on-primary': 'rgb(var(--tv-on-primary) / <alpha-value>)',
  				'on-primary-container': 'rgb(var(--tv-on-primary-container) / <alpha-value>)',
  				'on-primary-fixed': 'rgb(var(--tv-on-primary-fixed) / <alpha-value>)',
  				'on-primary-fixed-variant': 'rgb(var(--tv-on-primary-fixed-variant) / <alpha-value>)',
  				'on-secondary': 'rgb(var(--tv-on-secondary) / <alpha-value>)',
  				'on-secondary-container': 'rgb(var(--tv-on-secondary-container) / <alpha-value>)',
  				'on-secondary-fixed': 'rgb(var(--tv-on-secondary-fixed) / <alpha-value>)',
  				'on-secondary-fixed-variant': 'rgb(var(--tv-on-secondary-fixed-variant) / <alpha-value>)',
  				'on-surface': 'rgb(var(--tv-on-surface) / <alpha-value>)',
  				'on-surface-variant': 'rgb(var(--tv-on-surface-variant) / <alpha-value>)',
  				'on-tertiary': 'rgb(var(--tv-on-tertiary) / <alpha-value>)',
  				'on-tertiary-container': 'rgb(var(--tv-on-tertiary-container) / <alpha-value>)',
  				'on-tertiary-fixed': 'rgb(var(--tv-on-tertiary-fixed) / <alpha-value>)',
  				'on-tertiary-fixed-variant': 'rgb(var(--tv-on-tertiary-fixed-variant) / <alpha-value>)',
  				'outline': 'rgb(var(--tv-outline) / <alpha-value>)',
  				'outline-variant': 'rgb(var(--tv-outline-variant) / <alpha-value>)',
  				'primary': 'rgb(var(--tv-primary) / <alpha-value>)',
  				'primary-container': 'rgb(var(--tv-primary-container) / <alpha-value>)',
  				'primary-fixed': 'rgb(var(--tv-primary-fixed) / <alpha-value>)',
  				'primary-fixed-dim': 'rgb(var(--tv-primary-fixed-dim) / <alpha-value>)',
  				'secondary': 'rgb(var(--tv-secondary) / <alpha-value>)',
  				'secondary-container': 'rgb(var(--tv-secondary-container) / <alpha-value>)',
  				'secondary-fixed': 'rgb(var(--tv-secondary-fixed) / <alpha-value>)',
  				'secondary-fixed-dim': 'rgb(var(--tv-secondary-fixed-dim) / <alpha-value>)',
  				'surface': 'rgb(var(--tv-surface) / <alpha-value>)',
  				'surface-bright': 'rgb(var(--tv-surface-bright) / <alpha-value>)',
  				'surface-container': 'rgb(var(--tv-surface-container) / <alpha-value>)',
  				'surface-container-high': 'rgb(var(--tv-surface-container-high) / <alpha-value>)',
  				'surface-container-highest': 'rgb(var(--tv-surface-container-highest) / <alpha-value>)',
  				'surface-container-low': 'rgb(var(--tv-surface-container-low) / <alpha-value>)',
  				'surface-container-lowest': 'rgb(var(--tv-surface-container-lowest) / <alpha-value>)',
  				'surface-dim': 'rgb(var(--tv-surface-dim) / <alpha-value>)',
  				'surface-tint': 'rgb(var(--tv-surface-tint) / <alpha-value>)',
  				'surface-variant': 'rgb(var(--tv-surface-variant) / <alpha-value>)',
  				'tertiary': 'rgb(var(--tv-tertiary) / <alpha-value>)',
  				'tertiary-container': 'rgb(var(--tv-tertiary-container) / <alpha-value>)',
  				'tertiary-fixed': 'rgb(var(--tv-tertiary-fixed) / <alpha-value>)',
  				'tertiary-fixed-dim': 'rgb(var(--tv-tertiary-fixed-dim) / <alpha-value>)',
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
  				forest: { '100': '#D9E8DC', '200': '#A8D4B8', '800': '#1E7A1E', '900': '#228B22' },
  				rose:   { '100': '#FBE3EE', '200': '#F6C2D9', '800': '#9D174D', '900': '#BE185D' }
  			}
  		},
  		borderRadius: {
  			'tv': '0.125rem',
  			'tv-lg': '0.25rem',
  			'tv-xl': '0.5rem',
  			'tv-full': '9999px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontSize: {
  				'tv-display-lg': ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
  				'tv-headline-lg': ["32px", { lineHeight: "1.2", fontWeight: "700" }],
  				'tv-headline-lg-mobile': ["28px", { lineHeight: "1.2", fontWeight: "700" }],
  				'tv-headline-md': ["24px", { lineHeight: "1.3", fontWeight: "600" }],
  				'tv-italic-serif': ["20px", { lineHeight: "1.4", fontWeight: "400" }],
  				'tv-body-lg': ["18px", { lineHeight: "1.6", fontWeight: "400" }],
  				'tv-body-md': ["16px", { lineHeight: "1.5", fontWeight: "400" }],
  				'tv-label-caps': ["12px", { lineHeight: "1", letterSpacing: "0.1em", fontWeight: "600" }],
  		},
  		spacing: {
  			'tv-unit': '8px',
  			'tv-gutter': '24px',
  			'tv-margin-safe': '32px',
  			'tv-section-gap': '80px',
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
