
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'montserrat': ['Montserrat', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#2563eb', // Azul para botões e links
					foreground: 'white'
				},
				secondary: {
					DEFAULT: '#1f1f1f', // Preto principal
					foreground: 'white'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: '#2a2a2a', // Cinza escuro
					foreground: '#a3a3a3'
				},
				accent: {
					DEFAULT: '#0f0f0f', // Preto mais escuro
					foreground: 'white'
				},
				popover: {
					DEFAULT: '#1a1a1a',
					foreground: 'white'
				},
				card: {
					DEFAULT: '#171717',
					foreground: 'white'
				},
				sidebar: {
					DEFAULT: '#0a0a0a',
					foreground: 'white',
					primary: '#2563eb',
					'primary-foreground': 'white',
					accent: '#1f1f1f',
					'accent-foreground': 'white',
					border: '#2a2a2a',
					ring: '#2563eb'
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
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
