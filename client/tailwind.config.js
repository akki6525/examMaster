/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
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
                success: {
                    DEFAULT: "hsl(142, 76%, 36%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                warning: {
                    DEFAULT: "hsl(38, 92%, 50%)",
                    foreground: "hsl(0, 0%, 0%)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                sm: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
                DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
                md: "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
                lg: "0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
                xl: "0 20px 25px -5px rgb(0 0 0 / 0.04), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
                '2xl': "0 25px 50px -12px rgb(0 0 0 / 0.05)",
                'inner': "inset 0 2px 4px 0 rgb(0 0 0 / 0.02)",
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-up": "slideUp 0.4s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "shimmer": "shimmer 2s linear infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
            },
        },
    },
    plugins: [],
}
