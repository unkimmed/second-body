/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind가 스캔할 파일 경로
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
  ],
  // nativewind/preset → RN에 맞게 일부 유틸리티 조정
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surface hierarchy
        surface: '#fafafa',
        'surface-low': '#f0f0f0',
        'surface-lowest': '#ffffff',
        'surface-container': '#f4f4f4',
        'surface-high': '#e8e8e8',
        // Primary
        primary: '#1a1a1a',
        'primary-dim': '#000000',
        // On-surface
        'on-surface': '#1a1a1a',
        'on-surface-variant': '#6b6b6b',
        // Outline
        'outline-variant': '#c4c4c4',
        // Severity (1→5, muted red — saturation/depth increases)
        'severity-1': '#ecd3d0',
        'severity-2': '#dfaaa5',
        'severity-3': '#cf7f78',
        'severity-4': '#bb554d',
        'severity-5': '#9e3029',
        // Semantic
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
      },
    },
  },
  plugins: [],
}
