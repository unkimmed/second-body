import Constants from 'expo-constants'
import { Platform } from 'react-native'

const DEFAULT_PORT = 3001
const envUrl = process.env.EXPO_PUBLIC_API_URL

function isLocalHost(url: string) {
  return /\/\/(localhost|127\.0\.0\.1)\b/.test(url)
}

/** env URL 에 포트가 있으면 그 포트를, 없으면 기본 포트를 사용 */
function apiPort(): string {
  const m = envUrl?.match(/:(\d+)(?:\/|$)/)
  return m ? m[1] : String(DEFAULT_PORT)
}

/** Expo dev 서버 호스트(예: "192.168.0.55:8081")에서 IP/호스트만 추출 */
function expoHost(): string | null {
  const c = Constants as unknown as {
    expoConfig?: { hostUri?: string }
    expoGoConfig?: { debuggerHost?: string; hostUri?: string }
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } }
    manifest?: { debuggerHost?: string; hostUri?: string }
  }
  const hostUri =
    c.expoConfig?.hostUri ??
    c.expoGoConfig?.debuggerHost ??
    c.expoGoConfig?.hostUri ??
    c.manifest2?.extra?.expoGo?.debuggerHost ??
    c.manifest?.debuggerHost ??
    c.manifest?.hostUri
  const host = hostUri?.split(':')[0]
  return host || null
}

/**
 * API 주소 결정 규칙:
 * 1) EXPO_PUBLIC_API_URL 이 localhost 가 아닌 값으로 지정됐으면 그대로 사용(수동 오버라이드)
 * 2) 웹 브라우저는 localhost 가 곧 PC 이므로 그대로 사용
 * 3) 실기기/시뮬레이터는 Expo dev 서버 호스트에서 IP 를 유도 → PC 의 LAN IP 자동 사용
 */
function resolveApiUrl(): string {
  const fallback = `http://localhost:${apiPort()}/api`
  if (envUrl && !isLocalHost(envUrl)) return envUrl
  if (Platform.OS === 'web') return envUrl ?? fallback
  const host = expoHost()
  return host ? `http://${host}:${apiPort()}/api` : (envUrl ?? fallback)
}

export const API_URL = resolveApiUrl()
