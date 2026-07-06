const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// pnpm 워크스페이스에서 react-dom이 expo-router의 가상 node_modules에 없어서
// Metro가 찾지 못하는 문제를 직접 경로로 해결
config.resolver.extraNodeModules = {
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
}

// react-native-bottom-tabs는 네이티브 전용 모듈이라 웹 번들에 포함될 수 없음.
// Expo Router의 require.context가 _layout.native.tsx를 웹 번들에 포함시키기 때문에
// 웹 플랫폼에서는 빈 모듈로 대체해서 번들링 오류를 방지함.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-bottom-tabs') {
    return { type: 'empty' }
  }
  return context.resolveRequest(context, moduleName, platform)
}

// NativeWind의 CSS 처리를 Metro 번들러에 추가
module.exports = withNativeWind(config, { input: './global.css' })
