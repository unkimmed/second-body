import { withLayoutContext } from 'expo-router'
import {
  createNavigatorFactory,
  useNavigationBuilder,
  TabActions,
  TabRouter,
} from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/constants/theme'

const CENTER_TAB = 'records/new'
const HOME_TAB = 'index'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

// SF Symbol → Ionicons 매핑
function getIcon(
  routeName: string,
  isCenter: boolean,
  isHome: boolean,
  isFocused: boolean,
): { name: IoniconName; size: number; label: string } {
  if (isCenter && isHome) return { name: 'add', size: 26, label: '' }
  if (isCenter) return { name: isFocused ? 'home' : 'home-outline', size: 22, label: '홈' }
  if (routeName === 'records')
    return { name: isFocused ? 'reorder-three' : 'reorder-three-outline', size: 22, label: '기록' }
  if (routeName === 'mypage')
    return {
      name: isFocused ? 'person-circle' : 'person-circle-outline',
      size: 22,
      label: '마이페이지',
    }
  return { name: 'ellipse-outline', size: 22, label: routeName }
}

function JsBottomTabNavigator({ initialRouteName, children, screenOptions }: any) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    children,
    screenOptions,
  })
  const insets = useSafeAreaInsets()

  const homeIndex = state.routes.findIndex((r: any) => r.name === HOME_TAB)
  const isHome = state.index === homeIndex
  const homeKey = state.routes[homeIndex]?.key
  const activeKey = isHome ? homeKey : state.routes[state.index]?.key

  const displayTabs = state.routes.filter((r: any) => r.name !== HOME_TAB)

  return (
    <NavigationContent>
      <View style={styles.root}>
        <View style={styles.scenes}>
          {state.routes.map((route: any) => (
            <View
              key={route.key}
              style={[
                StyleSheet.absoluteFill,
                { display: route.key === activeKey ? 'flex' : 'none' },
              ]}
            >
              {descriptors[route.key].render()}
            </View>
          ))}
        </View>

        <View style={[styles.tabBarWrapper, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
          <View style={styles.tabBar}>
            {displayTabs.map((route: any) => {
              const isCenter = route.name === CENTER_TAB
              const isFocused = isHome ? isCenter : state.routes[state.index].key === route.key
              const iconColor = isFocused ? Colors.primary : '#c0c4c8'
              const { name, size } = getIcon(route.name, isCenter, isHome, isFocused)

              return (
                <TouchableOpacity
                  key={route.key}
                  style={[styles.tab, isFocused && styles.tabFocused, isCenter && styles.tabCenter]}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.dispatch(
                      TabActions.jumpTo(isCenter ? (isHome ? CENTER_TAB : HOME_TAB) : route.name),
                    )
                  }
                >
                  <Ionicons name={name} size={size} color={iconColor} />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>
    </NavigationContent>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
  },
  scenes: {
    flex: 1,
  },
  tabBarWrapper: {
    paddingHorizontal: 24,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 40,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 32,
    gap: 3,
  },
  tabFocused: {
    backgroundColor: 'rgba(69, 99, 115, 0.1)',
  },
  tabCenter: {
    flex: 1.2,
  },
})

const createJsBottomTabs = createNavigatorFactory(JsBottomTabNavigator)
const { Navigator } = createJsBottomTabs()
const Tabs = withLayoutContext(Navigator)

/** 순수 JS 탭 네비게이터 (네이티브 모듈 불필요) — 웹 및 Expo Go 폴백용 */
export function JsTabLayout() {
  return (
    <Tabs initialRouteName="index">
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="records/new" />
      <Tabs.Screen name="mypage" />
    </Tabs>
  )
}
