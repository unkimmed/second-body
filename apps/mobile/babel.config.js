module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      // jsxImportSource: 'nativewind' → className prop이 React Native 스타일로 변환됨
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'react-native-reanimated/plugin', // 반드시 마지막에 위치해야 함
    ],
  }
}
