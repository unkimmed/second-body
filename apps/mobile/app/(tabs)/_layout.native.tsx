import { withLayoutContext } from 'expo-router'
import {
  createNavigatorFactory,
  useNavigationBuilder,
  TabActions,
  TabRouter,
} from '@react-navigation/native'
import Constants from 'expo-constants'
import TabView from 'react-native-bottom-tabs'
import { JsTabLayout } from '@/components/JsTabNavigator'

// Expo Go 에는 react-native-bottom-tabs 의 네이티브 모듈(RNCTabView)이 없어
// dev build 가 아닐 때(Expo Go)는 JS 탭바로 폴백한다.
const isExpoGo = Constants.executionEnvironment === 'storeClient'

const CENTER_TAB = 'records/new'
const HOME_TAB = 'index'

function NativeBottomTabNavigator({ initialRouteName, children, screenOptions }: any) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    children,
    screenOptions,
  })

  const homeIndex = state.routes.findIndex((r: any) => r.name === HOME_TAB)
  const centerStateIndex = state.routes.findIndex((r: any) => r.name === CENTER_TAB)
  const isHome = state.index === homeIndex

  const homeKey = state.routes[homeIndex]?.key
  const centerKey = state.routes[centerStateIndex]?.key

  // index(홈)는 탭 바에서 제외 — 센터 탭 scene에서 직접 렌더링
  const displayRoutes = state.routes
    .filter((route: any) => route.name !== HOME_TAB)
    .map((route: any) => {
      const opts = descriptors[route.key].options

      if (route.name === CENTER_TAB) {
        return {
          key: route.key,
          title: '',
          focusedIcon: { sfSymbol: isHome ? 'plus' : 'house.fill' },
        }
      }

      const iconResult = opts.tabBarIcon?.({
        focused: state.routes[state.index].key === route.key,
        color: '',
      })
      return {
        key: route.key,
        title: opts.title ?? route.name,
        focusedIcon: iconResult,
      }
    })

  // 홈/추가 페이지에서는 센터 탭을 selected로, 그 외엔 현재 탭을 선택
  const displayIndex = isHome || state.index === centerStateIndex
    ? displayRoutes.findIndex((r: any) => r.key === centerKey)
    : displayRoutes.findIndex((r: any) => r.key === state.routes[state.index].key)

  return (
    <NavigationContent>
      <TabView
        navigationState={{ index: Math.max(0, displayIndex), routes: displayRoutes }}
        renderScene={({ route }: { route: { key: string } }) => {
          // 홈 상태일 때 센터 탭 scene에서 홈 화면 렌더링
          if (route.key === centerKey && isHome && homeKey) {
            return descriptors[homeKey].render()
          }
          return descriptors[route.key].render()
        }}
        onIndexChange={(pressedDisplayIndex: number) => {
          const pressedKey = displayRoutes[pressedDisplayIndex]?.key
          const pressedName = state.routes.find((r: any) => r.key === pressedKey)?.name

          if (pressedName === CENTER_TAB) {
            navigation.dispatch(TabActions.jumpTo(isHome ? CENTER_TAB : HOME_TAB))
          } else if (pressedName) {
            navigation.dispatch(TabActions.jumpTo(pressedName))
          }
        }}
      />
    </NavigationContent>
  )
}

const createNativeBottomTabs = createNavigatorFactory(NativeBottomTabNavigator)
const { Navigator } = createNativeBottomTabs()
const Tabs = withLayoutContext(Navigator)

export default function TabLayout() {
  // Expo Go: 네이티브 탭 모듈이 없으므로 JS 탭바로 폴백
  if (isExpoGo) return <JsTabLayout />

  return (
    <Tabs initialRouteName="index">
      <Tabs.Screen name="index" options={{ title: '' }} />
      <Tabs.Screen
        name="records"
        options={{
          title: '',
          tabBarIcon: () => ({ sfSymbol: 'line.3.horizontal' }),
        }}
      />
      <Tabs.Screen name="records/new" options={{ title: '' }} />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '',
          tabBarIcon: () => ({ sfSymbol: 'person.circle' }),
        }}
      />
    </Tabs>
  )
}
