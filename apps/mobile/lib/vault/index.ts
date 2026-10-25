import { getRandomValues } from 'expo-crypto'
import { createVault } from '@second-body/shared'
import { vaultStorage } from './storage'

// uuidv7 이 쓰는 crypto.getRandomValues 가 React Native 에는 없어서 expo-crypto 로 채운다
const g = globalThis as { crypto?: { getRandomValues?: unknown } }
if (!g.crypto?.getRandomValues) {
  g.crypto = { ...g.crypto, getRandomValues }
}

/** 앱 전체에서 쓰는 로컬 저장소 (iOS/Android: 파일, 웹: IndexedDB) */
export const vault = createVault(vaultStorage)
