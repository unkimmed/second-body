import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * 루트 레이아웃 — Next.js의 app/layout.tsx와 동일한 역할
 * 모든 화면을 감싸는 최상위 레이아웃
 *
 * Stack = 화면을 카드처럼 쌓는 네비게이션 (iOS의 push/pop)
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#6366f1' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Second Body' }} />
        <Stack.Screen name="symptoms/new" options={{ title: '증상 기록하기' }} />
        <Stack.Screen name="symptoms/[id]" options={{ title: '증상 상세' }} />
      </Stack>
    </>
  );
}
