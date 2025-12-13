/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#3ECF8E', // Supabase Green
                    400: '#34b27b',
                    500: '#3ECF8E',
                    600: '#2ea06d',
                },
                'brand-hover': {
                    DEFAULT: 'rgba(62, 207, 142, 0.2)', // Brand green with 20% opacity
                    100: 'rgba(62, 207, 142, 0.1)',
                    200: 'rgba(62, 207, 142, 0.2)',
                    300: 'rgba(62, 207, 142, 0.3)',
                },
                sidebar: {
                    DEFAULT: '#141414ff', // Very dark sidebar
                    border: '#2a2a2a',
                    hover: '#232323'
                },
                background: {
                    DEFAULT: '#151515ff', // Slightly darker main bg
                    card: '#191919'
                },
                'dark-blue': {
                    DEFAULT: '#090909', // Dark blue for selects and headers
                    50: '#1e3a5f',
                    100: '#1a3254',
                    200: '#162a49',
                    300: '#12223e',
                    400: '#0e1a33',
                    500: '#0a1228'
                }
            }
        },
    },
    plugins: [],
}
