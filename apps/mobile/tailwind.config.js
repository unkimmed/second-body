/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind가 스캔할 파일 경로
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  // nativewind/preset → RN에 맞게 일부 유틸리티 조정
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surface hierarchy
        surface: '#fbf9f5',
        'surface-low': '#f5f4ef',
        'surface-lowest': '#ffffff',
        'surface-container': '#f0efe9',
        'surface-high': '#e9e8e3',
        // Primary
        primary: '#456373',
        'primary-dim': '#395767',
        // On-surface
        'on-surface': '#31332f',
        'on-surface-variant': '#5e605b',
        // Outline
        'outline-variant': '#b2b2ac',
        // Semantic
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
      },
    },
  },
  plugins: [],
}
