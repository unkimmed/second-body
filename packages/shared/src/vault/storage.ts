/** vault 루트 기준 경로 */
export const VAULT_PATHS = {
  vault: 'vault.json',
  profile: 'profile.json',
  recordsDir: 'records',
  record: (id: string) => `records/${id}.json`,
} as const

/**
 * 플랫폼별 저장소 어댑터. 경로는 vault 루트 기준 상대 경로('/' 구분).
 * 모바일(앱 저장소 파일), 웹(OPFS / IndexedDB), 데스크톱(사용자 폴더)이 각각 구현한다.
 */
export interface VaultStorage {
  /** 디렉터리 안의 파일 이름 목록. 디렉터리가 없으면 빈 배열 */
  list(dir: string): Promise<string[]>
  /** 파일 내용. 없으면 null */
  read(path: string): Promise<string | null>
  /**
   * 원자적 쓰기: 임시 파일에 쓴 뒤 이름을 바꿔, 중간에 앱이 꺼져도 반쯤 쓰인 파일이 남지 않게 한다.
   * 상위 디렉터리가 없으면 만든다.
   */
  write(path: string, content: string): Promise<void>
  /** 파일 삭제. 없으면 무시. 기록 삭제는 delete 이벤트로 하고, 이건 충돌 사본 정리 등에만 쓴다. */
  remove(path: string): Promise<void>
}
