/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx,html}",
        "./pages/**/*.{js,ts,jsx,tsx,html}",
        "./components/**/*.{js,ts,jsx,tsx,html}",
        "./context/**/*.{js,ts,jsx,tsx,html}",
        "./hooks/**/*.{js,ts,jsx,tsx,html}",
        "./lib/**/*.{js,ts,jsx,tsx,html}",
        "./src/**/*.{js,ts,jsx,tsx,html}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                    900: '#881337',
                    vibrant: '#E61E1E',
                },
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
                dark: {
                    950: '#020617',
                    900: '#030712',
                    800: '#111827',
                    700: '#374151',
                    charcoal: '#0f172a',
                },
                light: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                },
                "border-light": "#f3f4f6",
                "dark-charcoal": "#111827",
                "menta-dark": "#2563eb",
                "menta": "#eff6ff",
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                "premium": "0 4px 20px -1px rgba(0, 0, 0, 0.05), 0 2px 10px -1px rgba(0, 0, 0, 0.03)",
                "trust": "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                "trust-lg": "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            },
            borderRadius: {
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            animation: {
                'float': 'float 4s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
