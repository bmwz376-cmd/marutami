/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        instructor: {
          primary: '#3b82f6',
          secondary: '#60a5fa',
        },
        student: {
          primary: '#10b981',
          secondary: '#34d399',
        },
      },
    },
  },
  plugins: [],
}
