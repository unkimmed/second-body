import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Native: AsyncStorage 사용
// Web: SSR(Node) 환경에서 window가 없으므로 localStorage를 직접 접근하되 guard 처리
function makeStorage() {
  if (Platform.OS !== "web") return AsyncStorage;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ls = (globalThis as any).localStorage as any;
  return {
    getItem: (key: string) => Promise.resolve(ls?.getItem(key) ?? null),
    setItem: (key: string, value: string) => {
      ls?.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      ls?.removeItem(key);
      return Promise.resolve();
    },
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: makeStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
