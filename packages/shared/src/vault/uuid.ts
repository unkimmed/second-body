type RandomSource = { getRandomValues(array: Uint8Array): Uint8Array }

/**
 * UUID v7 (RFC 9562). 앞 48비트 = 밀리초 타임스탬프, 나머지 = 난수 → 생성 시각순으로 정렬된다.
 * 전역 crypto.getRandomValues 가 필요하다 (브라우저·Node·Electron 기본 제공,
 * React Native 는 expo-crypto 등으로 폴리필).
 */
export function uuidv7(now: number = Date.now()): string {
  const random = (globalThis as { crypto?: RandomSource }).crypto
  if (!random?.getRandomValues) {
    throw new Error('uuidv7: crypto.getRandomValues 를 사용할 수 없습니다.')
  }
  const bytes = random.getRandomValues(new Uint8Array(16))

  let ts = now
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256
    ts = Math.floor(ts / 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70 // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
