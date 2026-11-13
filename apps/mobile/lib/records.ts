import { BodyPartCode, DerivedRecord, Severity } from '@second-body/shared'
import { vault } from '@/lib/vault'

// 기록은 기기 로컬 vault 에 저장한다

export async function fetchRecords(): Promise<DerivedRecord[]> {
  return vault.listRecords()
}

export async function fetchRecord(id: string): Promise<DerivedRecord> {
  const record = await vault.getRecord(id)
  if (!record) throw new Error('기록을 찾을 수 없습니다.')
  return record
}

export async function createRecord(payload: {
  record_date: string
  body_part_code: BodyPartCode
  severity: Severity
  note?: string
}): Promise<DerivedRecord> {
  return vault.createRecord(payload)
}

export async function patchRecord(
  id: string,
  payload: { body_part_code?: BodyPartCode; severity: Severity; note?: string },
): Promise<DerivedRecord> {
  return vault.updateRecord(id, payload)
}

export async function resolveRecord(id: string, resolved: boolean): Promise<DerivedRecord> {
  return vault.setResolved(id, resolved)
}

export async function deleteRecord(id: string): Promise<void> {
  await vault.deleteRecord(id)
}
