import '../global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '../lib/AuthContext'
import { AppHeader } from '../components/AppHeader'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuthScreen = segments[0] === 'login' || segments[0] === 'signup'

    if (!session && !inAuthScreen) {
      router.replace('/login')
    } else if (session && inAuthScreen) {
      router.replace('/')
    }
  }, [session, loading])

  return (
    <Stack
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Second Body' }} />
      <Stack.Screen name="records/new" options={{ title: '증상 기록하기' }} />
      <Stack.Screen name="records/[id]" options={{ title: '기록 상세' }} />
      <Stack.Screen
        name="records/index"
        options={{ title: '기록된 증상 목록', headerBackVisible: true }}
      />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
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
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  )
}
