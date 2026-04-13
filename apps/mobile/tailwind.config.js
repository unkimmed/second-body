/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind가 스캔할 파일 경로
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  // nativewind/preset → RN에 맞게 일부 유틸리티 조정
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',    // 인디고 (메인 색상)
        danger: '#ef4444',     // 빨강 (높은 심각도)
        warning: '#f59e0b',    // 노랑 (중간 심각도)
        success: '#22c55e',    // 초록 (낮은 심각도)
      },
    },
  },
  plugins: [],
};
