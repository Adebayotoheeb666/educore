
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                teal: {
                    50: '#e0f2f1',
                    100: '#b2dfdb',
                    200: '#80cbc4',
                    300: '#4db6ac',
                    400: '#26a69a',
                    500: '#009688', // Primary
                    600: '#00897b',
                    700: '#00796b',
                    800: '#00695c',
                    900: '#004d40',
                },
                dark: {
                    bg: '#121212',
                    card: '#1e1e1e',
                    text: '#e0e0e0',
                    input: '#2c2c2c',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
