import { withLayoutContext } from 'expo-router'
import {
  createNavigatorFactory,
  useNavigationBuilder,
  TabActions,
  TabRouter,
} from '@react-navigation/native'
import TabView from 'react-native-bottom-tabs'

function NativeBottomTabNavigator({ initialRouteName, children, screenOptions }: any) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    children,
    screenOptions,
  })

  const routes = state.routes.map((route: any) => {
    const opts = descriptors[route.key].options
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

  return (
    <NavigationContent>
      <TabView
        navigationState={{ index: state.index, routes }}
        renderScene={({ route }: { route: { key: string } }) => descriptors[route.key].render()}
        onIndexChange={(index: number) => {
          navigation.dispatch(TabActions.jumpTo(state.routes[index].name))
        }}
      />
    </NavigationContent>
  )
}

const createNativeBottomTabs = createNavigatorFactory(NativeBottomTabNavigator)
const { Navigator } = createNativeBottomTabs()
const Tabs = withLayoutContext(Navigator)

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: () => ({ sfSymbol: 'figure.stand' }),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '기록',
          tabBarIcon: () => ({ sfSymbol: 'clock.fill' }),
        }}
      />
    </Tabs>
  )
}
