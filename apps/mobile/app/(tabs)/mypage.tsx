import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Colors } from '@/constants/theme'

export default function MyPageScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View
      className="flex-1 items-center justify-center bg-surface-lowest"
      style={{ paddingTop: insets.top }}
    >
      <Text style={{ color: Colors.onSurfaceVariant }}>마이페이지 준비 중</Text>
    </View>
  )
}
