import '../global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { AppHeader } from '../components/AppHeader'
import { vault } from '../lib/vault'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const router = useRouter()
  const segments = useSegments()

  // 프로필이 없으면 첫 실행 → 온보딩
  useEffect(() => {
    if (segments[0] === 'onboarding') return
    vault
      .hasProfile()
      .then((has) => {
        if (!has) router.replace('/onboarding')
      })
      .catch(console.error)
  }, [])

  return (
    <Stack
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="records/[id]" options={{ title: '기록 상세' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard Variable': require('../assets/fonts/PretendardVariable.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  )
}
