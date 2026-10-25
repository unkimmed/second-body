import type { AvatarGender, BodyPartCode, Severity, SkinTone } from './symptom'

// 로컬 저장소(vault) 파일 형식 v1
//
// Second Body/
//   vault.json          VaultFile
//   profile.json        ProfileFile
//   records/<id>.json   RecordFile
//
// 공통 규칙
// - 시각은 UTC ISO 문자열(`Date#toISOString()`, ...Z). 문자열 비교로 정렬 가능해야 한다.
// - 날짜(record_date)만 사용자 로컬 기준 'YYYY-MM-DD'.
// - id 는 UUID v7 (시간순 정렬 가능).
// - JSON.stringify(obj, null, 2), 키 순서는 아래 타입 선언 순서로 고정.

export const VAULT_SCHEMA_VERSION = 1 as const

/** vault 폴더 식별 정보. 생성 후 바뀌지 않는다. */
export interface VaultFile {
  schema_version: typeof VAULT_SCHEMA_VERSION
  vault_id: string
  created_at: string
}

/** 프로필. 병합은 파일 전체 단위로 updated_at 이 큰 쪽이 이긴다. */
export interface ProfileFile {
  schema_version: typeof VAULT_SCHEMA_VERSION
  name: string
  avatar_name: string
  skin_tone: SkinTone
  gender: AvatarGender
  updated_at: string
}

/** 강도·메모 변경. 기록 생성 시 첫 이벤트도 update 이다. */
export interface RecordUpdateEvent {
  id: string
  at: string
  type: 'update'
  severity: Severity
  note: string | null
}

/** 해결 처리 */
export interface RecordResolveEvent {
  id: string
  at: string
  type: 'resolve'
}

/** 해결 취소(다시 진행중) */
export interface RecordReopenEvent {
  id: string
  at: string
  type: 'reopen'
}

/** 삭제(묘비). 하나라도 있으면 그 기록은 삭제된 것으로 본다. */
export interface RecordDeleteEvent {
  id: string
  at: string
  type: 'delete'
}

export type RecordEvent =
  | RecordUpdateEvent
  | RecordResolveEvent
  | RecordReopenEvent
  | RecordDeleteEvent

/**
 * 증상 기록 하나 = 파일 하나. 머리 정보(id ~ created_at)는 생성 후 바뀌지 않고,
 * 이후 변경은 전부 events 에 추가만 한다(수정·삭제 금지).
 *
 * 병합: 두 사본의 events 를 id 기준 합집합 → (at, id) 순 정렬. 그 외 규칙 없음.
 * 현재 상태는 events 에서 계산한다.
 * - severity, note: 마지막 update
 * - resolved_at: resolve/reopen 중 마지막이 resolve 면 그 at, 아니면 null
 *   (resolve 뒤에 update 가 와도 해결 상태는 유지된다. 다시 진행중으로 돌리려면 reopen)
 * - deleted: delete 가 하나라도 있으면 true
 * - updated_at: 마지막 이벤트의 at
 */
export interface RecordFile {
  schema_version: typeof VAULT_SCHEMA_VERSION
  id: string
  record_date: string
  body_part_code: BodyPartCode
  created_at: string
  events: RecordEvent[]
}
