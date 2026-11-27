import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  future: { hoverOnlyWhenSupported: true },
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { fontFamily: {
    display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'] } } },
  plugins: [containerQueries],
};
