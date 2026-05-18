const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// pnpm 워크스페이스에서 react-dom이 expo-router의 가상 node_modules에 없어서
// Metro가 찾지 못하는 문제를 직접 경로로 해결
config.resolver.extraNodeModules = {
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
}

// NativeWind의 CSS 처리를 Metro 번들러에 추가
module.exports = withNativeWind(config, { input: './global.css' })
