/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // Enable class-based dark mode
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
                    DEFAULT: '#141414ff', // Very dark sidebar (dark mode)
                    light: '#f8f9fa', // Light sidebar (light mode)
                    border: '#2a2a2a', // Dark border
                    'border-light': '#e5e7eb', // Light border
                    hover: '#232323', // Dark hover
                    'hover-light': '#e8e9eb' // Light hover
                },
                background: {
                    DEFAULT: '#151515ff', // Slightly darker main bg (dark mode)
                    light: '#ffffff', // Light main bg (light mode)
                    card: '#191919', // Dark card
                    'card-light': '#f5f5f5' // Light card
                },
                'dark-blue': {
                    DEFAULT: '#090909', // Dark blue for selects and headers (dark mode)
                    light: '#f3f4f6', // Light gray for selects and headers (light mode)
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
