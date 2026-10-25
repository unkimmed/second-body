import { BODY_PART_CODES, BodyPartCode, Severity, SymptomRecord } from '../types/symptom'
import { RecordEvent, RecordFile, VAULT_SCHEMA_VERSION } from '../types/vault'
import { uuidv7 } from './uuid'

/** 화면에서 쓰는 기록 모양. 로컬 단일 사용자라 user_id 는 없다. */
export type DerivedRecord = Omit<SymptomRecord, 'user_id'>

/** (at, id) 순 정렬. 같은 시각이면 id 로 순서를 고정해 모든 기기에서 결과가 같게 한다. */
function compareEvents(a: RecordEvent, b: RecordEvent): number {
  if (a.at !== b.at) return a.at < b.at ? -1 : 1
  if (a.id !== b.id) return a.id < b.id ? -1 : 1
  return 0
}

function withEvent(file: RecordFile, event: RecordEvent): RecordFile {
  return { ...file, events: [...file.events, event].sort(compareEvents) }
}

export function createRecordFile(
  input: {
    record_date: string
    body_part_code: BodyPartCode
    severity: Severity
    note?: string | null
  },
  now: Date = new Date(),
): RecordFile {
  const at = now.toISOString()
  return {
    schema_version: VAULT_SCHEMA_VERSION,
    id: uuidv7(now.getTime()),
    record_date: input.record_date,
    body_part_code: input.body_part_code,
    created_at: at,
    events: [
      {
        id: uuidv7(now.getTime()),
        at,
        type: 'update',
        severity: input.severity,
        note: input.note || null,
      },
    ],
  }
}

export function appendUpdate(
  file: RecordFile,
  input: { severity: Severity; note?: string | null },
  now: Date = new Date(),
): RecordFile {
  return withEvent(file, {
    id: uuidv7(now.getTime()),
    at: now.toISOString(),
    type: 'update',
    severity: input.severity,
    note: input.note || null,
  })
}

/** 이미 해결 상태면 그대로 돌려준다 */
export function appendResolve(file: RecordFile, now: Date = new Date()): RecordFile {
  if (deriveState(file).resolved_at) return file
  return withEvent(file, { id: uuidv7(now.getTime()), at: now.toISOString(), type: 'resolve' })
}

/** 이미 진행중이면 그대로 돌려준다 */
export function appendReopen(file: RecordFile, now: Date = new Date()): RecordFile {
  if (!deriveState(file).resolved_at) return file
  return withEvent(file, { id: uuidv7(now.getTime()), at: now.toISOString(), type: 'reopen' })
}

export function appendDelete(file: RecordFile, now: Date = new Date()): RecordFile {
  if (deriveState(file).deleted) return file
  return withEvent(file, { id: uuidv7(now.getTime()), at: now.toISOString(), type: 'delete' })
}

/**
 * 같은 기록의 두 사본을 합친다. events 를 id 기준 합집합 → (at, id) 정렬.
 * 순서·반복과 무관하게 결과가 같다 (merge(a, b) = merge(b, a), merge(a, a) = a).
 */
export function mergeRecord(a: RecordFile, b: RecordFile): RecordFile {
  if (a.id !== b.id) throw new Error(`mergeRecord: 다른 기록입니다 (${a.id} / ${b.id})`)
  const byId = new Map<string, RecordEvent>()
  for (const e of [...a.events, ...b.events]) {
    if (!byId.has(e.id)) byId.set(e.id, e)
  }
  return { ...a, events: [...byId.values()].sort(compareEvents) }
}

function deriveState(file: RecordFile) {
  let last: Extract<RecordEvent, { type: 'update' }> | null = null
  let resolved_at: string | null = null
  let deleted = false
  for (const e of [...file.events].sort(compareEvents)) {
    if (e.type === 'update') last = e
    else if (e.type === 'resolve') resolved_at = e.at
    else if (e.type === 'reopen') resolved_at = null
    else deleted = true
  }
  return { last, resolved_at, deleted }
}

/**
 * events 에서 현재 상태를 계산한다. 삭제된 기록이면 null.
 * - severity, note: 마지막 update
 * - resolved_at: resolve/reopen 중 마지막 (resolve 뒤 update 가 와도 해결 유지)
 * - updated_at: 마지막 이벤트 시각
 */
export function deriveRecord(file: RecordFile): DerivedRecord | null {
  const { last, resolved_at, deleted } = deriveState(file)
  if (deleted) return null
  if (!last) throw new Error(`deriveRecord: update 이벤트가 없습니다 (${file.id})`)
  return {
    id: file.id,
    record_date: file.record_date,
    body_part_code: file.body_part_code,
    severity: last.severity,
    note: last.note ?? undefined,
    resolved_at,
    created_at: file.created_at,
    updated_at: file.events.reduce((max, e) => (e.at > max ? e.at : max), file.created_at),
  }
}

/** 강도·메모 변경 이력 (시간순). 강도 추이 표시용 */
export function severityHistory(
  file: RecordFile,
): { at: string; severity: Severity; note: string | null }[] {
  return [...file.events]
    .sort(compareEvents)
    .flatMap((e) => (e.type === 'update' ? [{ at: e.at, severity: e.severity, note: e.note }] : []))
}

// ---- 직렬화 / 검증 ----

/** 키 순서를 고정해 직렬화한다. 같은 내용이면 항상 같은 문자열이 나온다. */
export function serializeRecordFile(file: RecordFile): string {
  const events = [...file.events]
    .sort(compareEvents)
    .map((e) =>
      e.type === 'update'
        ? { id: e.id, at: e.at, type: e.type, severity: e.severity, note: e.note }
        : { id: e.id, at: e.at, type: e.type },
    )
  const ordered = {
    schema_version: file.schema_version,
    id: file.id,
    record_date: file.record_date,
    body_part_code: file.body_part_code,
    created_at: file.created_at,
    events,
  }
  return JSON.stringify(ordered, null, 2) + '\n'
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const BODY_PART_SET = new Set<string>(BODY_PART_CODES)

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseEvent(v: unknown, where: string): RecordEvent {
  if (!isObject(v)) throw new Error(`${where}: 객체가 아닙니다`)
  const { id, at, type } = v
  if (typeof id !== 'string' || typeof at !== 'string') throw new Error(`${where}: id/at 누락`)
  if (type === 'update') {
    const { severity, note } = v
    if (
      typeof severity !== 'number' ||
      !Number.isInteger(severity) ||
      severity < 1 ||
      severity > 5
    ) {
      throw new Error(`${where}: severity 는 1~5 정수여야 합니다`)
    }
    if (note !== null && typeof note !== 'string') throw new Error(`${where}: note 형식 오류`)
    return { id, at, type, severity: severity as Severity, note }
  }
  if (type === 'resolve' || type === 'reopen' || type === 'delete') return { id, at, type }
  throw new Error(`${where}: 알 수 없는 이벤트 type (${String(type)})`)
}

/** 파일 내용을 검증해 RecordFile 로 읽는다. 형식이 틀리면 예외. */
export function parseRecordFile(text: string): RecordFile {
  const v: unknown = JSON.parse(text)
  if (!isObject(v)) throw new Error('parseRecordFile: 객체가 아닙니다')
  if (v.schema_version !== VAULT_SCHEMA_VERSION) {
    throw new Error(`parseRecordFile: 지원하지 않는 schema_version (${String(v.schema_version)})`)
  }
  const { id, record_date, body_part_code, created_at, events } = v
  if (typeof id !== 'string') throw new Error('parseRecordFile: id 누락')
  if (typeof record_date !== 'string' || !DATE_RE.test(record_date)) {
    throw new Error(`parseRecordFile(${id}): record_date 형식 오류`)
  }
  if (typeof body_part_code !== 'string' || !BODY_PART_SET.has(body_part_code)) {
    throw new Error(`parseRecordFile(${id}): 알 수 없는 body_part_code`)
  }
  if (typeof created_at !== 'string') throw new Error(`parseRecordFile(${id}): created_at 누락`)
  if (!Array.isArray(events)) throw new Error(`parseRecordFile(${id}): events 누락`)
  return {
    schema_version: VAULT_SCHEMA_VERSION,
    id,
    record_date,
    body_part_code: body_part_code as BodyPartCode,
    created_at,
    events: events.map((e, i) => parseEvent(e, `parseRecordFile(${id}).events[${i}]`)),
  }
}
