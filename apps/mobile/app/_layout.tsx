import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { FontFamily, FontWeight } from "../constants/theme";

SplashScreen.preventAutoHideAsync();

/**
 * 루트 레이아웃 — Next.js의 app/layout.tsx와 동일한 역할
 * 모든 화면을 감싸는 최상위 레이아웃
 *
 * Stack = 화면을 카드처럼 쌓는 네비게이션 (iOS의 push/pop)
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Pretendard Variable": require("../assets/fonts/PretendardVariable.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#6366f1" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontFamily: FontFamily.base,
            fontWeight: FontWeight.bold,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Second Body" }} />
        <Stack.Screen
          name="symptoms/new"
          options={{ title: "증상 기록하기" }}
        />
        <Stack.Screen name="symptoms/[id]" options={{ title: "증상 상세" }} />
      </Stack>
    </>
  );
}
