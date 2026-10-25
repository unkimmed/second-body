import { describe, expect, it } from 'vitest'
import { RecordFile } from '../types/vault'
import {
  appendDelete,
  appendReopen,
  appendResolve,
  appendUpdate,
  createRecordFile,
  deriveRecord,
  mergeRecord,
  parseRecordFile,
  serializeRecordFile,
  severityHistory,
} from './record'
import { uuidv7 } from './uuid'

const t = (hhmm: string) => new Date(`2026-10-25T${hhmm}:00.000Z`)

function baseRecord(): RecordFile {
  return createRecordFile(
    { record_date: '2026-10-25', body_part_code: 'head', severity: 3, note: '지끈' },
    t('09:00'),
  )
}

describe('uuidv7', () => {
  it('v7 형식이다', () => {
    expect(uuidv7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('시각순으로 정렬된다', () => {
    const a = uuidv7(Date.parse('2026-10-25T09:00:00Z'))
    const b = uuidv7(Date.parse('2026-10-25T09:00:01Z'))
    expect(a < b).toBe(true)
  })
})

describe('createRecordFile / deriveRecord', () => {
  it('첫 update 로 상태를 만든다', () => {
    const r = deriveRecord(baseRecord())!
    expect(r).toMatchObject({
      record_date: '2026-10-25',
      body_part_code: 'head',
      severity: 3,
      note: '지끈',
      resolved_at: null,
      created_at: '2026-10-25T09:00:00.000Z',
      updated_at: '2026-10-25T09:00:00.000Z',
    })
  })

  it('빈 메모는 null 로 저장하고 undefined 로 보여준다', () => {
    const file = createRecordFile({
      record_date: '2026-10-25',
      body_part_code: 'neck',
      severity: 2,
      note: '',
    })
    expect(file.events[0]).toMatchObject({ note: null })
    expect(deriveRecord(file)!.note).toBeUndefined()
  })

  it('update 가 없으면 예외', () => {
    expect(() => deriveRecord({ ...baseRecord(), events: [] })).toThrow()
  })
})

describe('이벤트 추가', () => {
  it('마지막 update 가 현재 강도·메모가 되고 이력은 남는다', () => {
    const file = appendUpdate(baseRecord(), { severity: 4, note: '약 먹음' }, t('10:00'))
    expect(deriveRecord(file)).toMatchObject({
      severity: 4,
      note: '약 먹음',
      updated_at: '2026-10-25T10:00:00.000Z',
    })
    expect(severityHistory(file).map((h) => h.severity)).toEqual([3, 4])
  })

  it('resolve → reopen → resolve', () => {
    let file = appendResolve(baseRecord(), t('10:00'))
    expect(deriveRecord(file)!.resolved_at).toBe('2026-10-25T10:00:00.000Z')
    file = appendReopen(file, t('11:00'))
    expect(deriveRecord(file)!.resolved_at).toBeNull()
    file = appendResolve(file, t('12:00'))
    expect(deriveRecord(file)!.resolved_at).toBe('2026-10-25T12:00:00.000Z')
  })

  it('resolve 뒤에 update 가 와도 해결 상태는 유지된다', () => {
    const file = appendUpdate(appendResolve(baseRecord(), t('10:00')), { severity: 4 }, t('10:05'))
    expect(deriveRecord(file)).toMatchObject({
      severity: 4,
      resolved_at: '2026-10-25T10:00:00.000Z',
    })
  })

  it('이미 같은 상태면 이벤트를 추가하지 않는다', () => {
    const resolved = appendResolve(baseRecord(), t('10:00'))
    expect(appendResolve(resolved, t('10:01'))).toBe(resolved)
    const open = baseRecord()
    expect(appendReopen(open, t('10:01'))).toBe(open)
  })

  it('delete 가 있으면 null', () => {
    expect(deriveRecord(appendDelete(baseRecord(), t('10:00')))).toBeNull()
  })

  it('원본 파일을 바꾸지 않는다', () => {
    const file = baseRecord()
    appendUpdate(file, { severity: 5 }, t('10:00'))
    expect(file.events).toHaveLength(1)
  })
})

describe('mergeRecord', () => {
  it('iPhone 해결 + Mac 강도 수정 → 둘 다 남는다', () => {
    const base = baseRecord()
    const iphone = appendResolve(base, t('10:00'))
    const mac = appendUpdate(base, { severity: 4, note: '약 먹음' }, t('10:05'))
    const merged = deriveRecord(mergeRecord(iphone, mac))
    expect(merged).toMatchObject({
      severity: 4,
      note: '약 먹음',
      resolved_at: '2026-10-25T10:00:00.000Z',
    })
  })

  it('양쪽 강도 수정은 둘 다 이력에 남고 늦은 쪽이 현재 값', () => {
    const base = baseRecord()
    const a = appendUpdate(base, { severity: 4 }, t('10:00'))
    const b = appendUpdate(base, { severity: 2 }, t('10:05'))
    const merged = mergeRecord(a, b)
    expect(severityHistory(merged).map((h) => h.severity)).toEqual([3, 4, 2])
    expect(deriveRecord(merged)!.severity).toBe(2)
  })

  it('한쪽이 삭제하면 삭제된다', () => {
    const base = baseRecord()
    const merged = mergeRecord(
      appendDelete(base, t('10:00')),
      appendUpdate(base, { severity: 5 }, t('10:05')),
    )
    expect(deriveRecord(merged)).toBeNull()
  })

  it('교환 법칙·멱등성: 순서와 반복에 상관없이 같은 파일', () => {
    const base = baseRecord()
    const a = appendResolve(appendUpdate(base, { severity: 4 }, t('10:00')), t('10:10'))
    const b = appendReopen(appendResolve(base, t('10:02')), t('10:20'))
    const ab = serializeRecordFile(mergeRecord(a, b))
    expect(serializeRecordFile(mergeRecord(b, a))).toBe(ab)
    expect(serializeRecordFile(mergeRecord(mergeRecord(a, b), b))).toBe(ab)
    expect(serializeRecordFile(mergeRecord(a, a))).toBe(serializeRecordFile(a))
  })

  it('id 가 다르면 예외', () => {
    expect(() => mergeRecord(baseRecord(), baseRecord())).toThrow()
  })
})

describe('직렬화 / 검증', () => {
  it('직렬화 → 파싱 → 직렬화 결과가 같다', () => {
    const file = appendResolve(appendUpdate(baseRecord(), { severity: 4 }, t('10:00')), t('11:00'))
    const text = serializeRecordFile(file)
    expect(serializeRecordFile(parseRecordFile(text))).toBe(text)
  })

  it('키 순서가 달라도 같은 문자열로 직렬화된다', () => {
    const file = baseRecord()
    const shuffled = { events: file.events, created_at: file.created_at, ...file }
    expect(serializeRecordFile(shuffled)).toBe(serializeRecordFile(file))
  })

  it.each([
    ['schema_version', { schema_version: 2 }],
    ['record_date', { record_date: '2026/10/25' }],
    ['body_part_code', { body_part_code: 'tail' }],
    ['events', { events: 'x' }],
    [
      'severity',
      {
        events: [
          { id: 'e', at: '2026-10-25T09:00:00.000Z', type: 'update', severity: 6, note: null },
        ],
      },
    ],
    ['event type', { events: [{ id: 'e', at: '2026-10-25T09:00:00.000Z', type: 'explode' }] }],
  ])('잘못된 %s 는 거부한다', (_, patch) => {
    expect(() => parseRecordFile(JSON.stringify({ ...baseRecord(), ...patch }))).toThrow()
  })
})
