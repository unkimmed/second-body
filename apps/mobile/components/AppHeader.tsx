import { View, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackHeaderProps } from '@react-navigation/native-stack'
import { Text } from '@/components/Text'
import { Colors, FontFamily, FontWeight } from '@/constants/theme'

const HEADER_HEIGHT = 44

export function AppHeader({ options, back, navigation }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        backgroundColor: Colors.primary,
        paddingTop: insets.top,
        height: insets.top + HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      {back && (
        <TouchableOpacity onPress={navigation.goBack} hitSlop={8}>
          <Text style={{ color: Colors.surface, fontSize: 22, lineHeight: 26 }}>←</Text>
        </TouchableOpacity>
      )}
      <Text
        style={{
          color: Colors.surface,
          fontFamily: FontFamily.base,
          fontWeight: FontWeight.bold,
          fontSize: 14,
          flex: 1,
        }}
      >
        {options.title ?? ''}
      </Text>
    </View>
  )
}
