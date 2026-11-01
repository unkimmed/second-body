import { describe, expect, it } from 'vitest'
import { appendUpdate, parseRecordFile, serializeRecordFile } from './record'
import { createMemoryStorage } from './memory-storage'
import { VAULT_PATHS } from './storage'
import { createVault } from './vault'

let tick = 0
const clock = () => new Date(Date.UTC(2026, 9, 25, 9, 0, tick++))

const input = { record_date: '2026-10-25', body_part_code: 'head', severity: 3 } as const

describe('createVault', () => {
  it('처음 열면 vault.json 을 만든다', async () => {
    const storage = createMemoryStorage()
    await createVault(storage, clock).listRecords()
    expect(storage.files.has(VAULT_PATHS.vault)).toBe(true)
  })

  it('생성 → 다른 인스턴스에서 다시 읽기', async () => {
    const storage = createMemoryStorage()
    const created = await createVault(storage, clock).createRecord({ ...input, note: '지끈' })
    expect(storage.files.has(VAULT_PATHS.record(created.id))).toBe(true)

    const reopened = await createVault(storage, clock).getRecord(created.id)
    expect(reopened).toMatchObject({ body_part_code: 'head', severity: 3, note: '지끈' })
  })

  it('수정·해결·삭제', async () => {
    const vault = createVault(createMemoryStorage(), clock)
    const { id } = await vault.createRecord(input)

    expect(await vault.updateRecord(id, { body_part_code: 'neck', severity: 4 })).toMatchObject({
      body_part_code: 'neck',
      severity: 4,
    })
    expect((await vault.setResolved(id, true)).resolved_at).not.toBeNull()
    expect((await vault.setResolved(id, false)).resolved_at).toBeNull()

    await vault.deleteRecord(id)
    expect(await vault.getRecord(id)).toBeNull()
    expect(await vault.listRecords()).toHaveLength(0)
    await expect(vault.updateRecord(id, { severity: 1 })).rejects.toThrow()
  })

  it('저장할 때 다른 기기가 디스크에 쓴 변경을 덮어쓰지 않는다', async () => {
    const storage = createMemoryStorage()
    const vault = createVault(storage, clock)
    const { id } = await vault.createRecord(input)

    // 동기화로 다른 기기의 수정이 디스크에 들어온 상황 (인덱스는 모름)
    const path = VAULT_PATHS.record(id)
    const remote = appendUpdate(parseRecordFile(storage.files.get(path)!), { severity: 5 }, clock())
    storage.files.set(path, serializeRecordFile(remote))

    await vault.setResolved(id, true)
    const onDisk = parseRecordFile(storage.files.get(path)!)
    expect(onDisk.events.map((e) => e.type)).toEqual(['update', 'update', 'resolve'])
    expect(await createVault(storage, clock).getRecord(id)).toMatchObject({ severity: 5 })
  })

  it('동시에 저장해도 이벤트가 사라지지 않는다', async () => {
    const vault = createVault(createMemoryStorage(), clock)
    const { id } = await vault.createRecord(input)
    await Promise.all([
      vault.updateRecord(id, { severity: 4 }),
      vault.setResolved(id, true),
      vault.updateRecord(id, { severity: 5 }),
    ])
    const file = (await vault.getRecordFile(id))!
    expect(file.events.map((e) => e.type)).toEqual(['update', 'update', 'resolve', 'update'])
  })

  it('reload 하면 바깥에서 추가된 파일을 읽는다', async () => {
    const storage = createMemoryStorage()
    const vault = createVault(storage, clock)
    expect(await vault.listRecords()).toHaveLength(0)

    const { id } = await createVault(storage, clock).createRecord(input)
    expect(await vault.getRecord(id)).toBeNull()
    await vault.reload()
    expect(await vault.getRecord(id)).not.toBeNull()
  })

  it('깨진 파일과 .json 이 아닌 파일은 건너뛴다', async () => {
    const storage = createMemoryStorage({
      'records/broken.json': '{ not json',
      'records/x.json.tmp': '{}',
    })
    const vault = createVault(storage, clock)
    await vault.createRecord(input)
    expect(await vault.listRecords()).toHaveLength(1)
  })

  it('프로필: 없으면 기본값, 저장 후 다시 읽기', async () => {
    const storage = createMemoryStorage()
    const vault = createVault(storage, clock)
    expect(await vault.hasProfile()).toBe(false)
    expect(await vault.getProfile()).toMatchObject({
      name: '',
      skin_tone: 'medium',
      gender: 'male',
    })

    await vault.saveProfile({
      name: '영채',
      avatar_name: '둘째',
      skin_tone: 'light',
      gender: 'female',
    })
    expect(await vault.hasProfile()).toBe(true)
    expect(await createVault(storage, clock).getProfile()).toMatchObject({
      name: '영채',
      avatar_name: '둘째',
      skin_tone: 'light',
      gender: 'female',
    })
  })
})
