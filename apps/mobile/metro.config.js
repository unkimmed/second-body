const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// NativeWind의 CSS 처리를 Metro 번들러에 추가
module.exports = withNativeWind(config, { input: './global.css' });
