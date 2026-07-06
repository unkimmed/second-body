import { withLayoutContext } from 'expo-router'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const { Navigator } = createBottomTabNavigator()
const Tabs = withLayoutContext(Navigator)

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="records" options={{ title: '기록' }} />
    </Tabs>
  )
}
