import { Text as RNText, TextProps } from 'react-native'
import { FontFamily } from '../constants/theme'

export function Text({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: FontFamily.base }, style]} {...props} />
}
