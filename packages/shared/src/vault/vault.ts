import { BodyPartCode, Severity } from '../types/symptom'
import { ProfileFile, RecordFile } from '../types/vault'
import {
  createProfileFile,
  createVaultFile,
  mergeProfile,
  parseProfileFile,
  parseVaultFile,
  serializeProfileFile,
  serializeVaultFile,
} from './files'
import {
  appendDelete,
  appendReopen,
  appendResolve,
  appendUpdate,
  createRecordFile,
  deriveRecord,
  DerivedRecord,
  mergeRecord,
  parseRecordFile,
  serializeRecordFile,
} from './record'
import { VAULT_PATHS, VaultStorage } from './storage'

// shared 는 DOM/Node 타입을 포함하지 않으므로 필요한 것만 선언
declare const console: { warn(...args: unknown[]): void }

export interface Vault {
  /** 삭제되지 않은 기록 전체 (순서 없음) */
  listRecords(): Promise<DerivedRecord[]>
  /** 없거나 삭제됐으면 null */
  getRecord(id: string): Promise<DerivedRecord | null>
  /** 기록 파일 원본 (이력 표시용). 없으면 null */
  getRecordFile(id: string): Promise<RecordFile | null>
  createRecord(input: {
    record_date: string
    body_part_code: BodyPartCode
    severity: Severity
    note?: string | null
  }): Promise<DerivedRecord>
  updateRecord(
    id: string,
    input: { body_part_code?: BodyPartCode; severity: Severity; note?: string | null },
  ): Promise<DerivedRecord>
  setResolved(id: string, resolved: boolean): Promise<DerivedRecord>
  deleteRecord(id: string): Promise<void>
  getProfile(): Promise<ProfileFile>
  saveProfile(
    input: Pick<ProfileFile, 'name' | 'avatar_name' | 'skin_tone' | 'gender'>,
  ): Promise<ProfileFile>
  /** 파일을 다시 읽어 인덱스를 새로 만든다 (동기화로 파일이 바뀌었을 때) */
  reload(): Promise<void>
}

/**
 * VaultStorage 위에 기록 인덱스(메모리)와 읽기-병합-쓰기를 얹는다. 플랫폼과 무관하다.
 * - 처음 호출될 때 records/ 를 전부 읽어 인덱스를 만든다. 읽을 수 없는 파일은 건너뛴다.
 * - 저장할 때는 디스크의 최신본을 다시 읽어 병합한 뒤 쓴다 (동기화로 바뀐 내용을 덮어쓰지 않게).
 * - 쓰기는 한 번에 하나씩 순서대로 처리한다.
 */
export function createVault(storage: VaultStorage, clock: () => Date = () => new Date()): Vault {
  let index: Map<string, RecordFile> | null = null
  let loading: Promise<Map<string, RecordFile>> | null = null
  let queue: Promise<unknown> = Promise.resolve()

  function serial<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task)
    queue = run.catch(() => undefined)
    return run
  }

  async function readRecordFile(path: string): Promise<RecordFile | null> {
    const text = await storage.read(path)
    if (text === null) return null
    try {
      return parseRecordFile(text)
    } catch (e) {
      console.warn(`[vault] ${path} 를 읽을 수 없어 건너뜁니다:`, e)
      return null
    }
  }

  async function load(): Promise<Map<string, RecordFile>> {
    if (index) return index
    if (!loading) {
      loading = (async () => {
        const vaultText = await storage.read(VAULT_PATHS.vault)
        if (vaultText === null) {
          await storage.write(VAULT_PATHS.vault, serializeVaultFile(createVaultFile(clock())))
        } else {
          parseVaultFile(vaultText)
        }

        const map = new Map<string, RecordFile>()
        const names = await storage.list(VAULT_PATHS.recordsDir)
        const files = await Promise.all(
          names
            .filter((n) => n.endsWith('.json'))
            .map((n) => readRecordFile(`${VAULT_PATHS.recordsDir}/${n}`)),
        )
        for (const f of files) {
          if (!f) continue
          const prev = map.get(f.id)
          map.set(f.id, prev ? mergeRecord(prev, f) : f)
        }
        index = map
        return map
      })().finally(() => {
        loading = null
      })
    }
    return loading
  }

  /** 디스크 최신본과 병합해 저장하고 인덱스를 갱신한다 */
  async function persist(file: RecordFile): Promise<RecordFile> {
    const map = await load()
    const path = VAULT_PATHS.record(file.id)
    const onDisk = await readRecordFile(path)
    const merged = onDisk ? mergeRecord(onDisk, file) : file
    await storage.write(path, serializeRecordFile(merged))
    map.set(merged.id, merged)
    return merged
  }

  async function mutate(id: string, change: (file: RecordFile) => RecordFile) {
    return serial(async () => {
      const map = await load()
      const current = map.get(id)
      if (!current || !deriveRecord(current)) throw new Error(`기록을 찾을 수 없습니다 (${id})`)
      return persist(change(current))
    })
  }

  function derived(file: RecordFile): DerivedRecord {
    const r = deriveRecord(file)
    if (!r) throw new Error(`삭제된 기록입니다 (${file.id})`)
    return r
  }

  return {
    async listRecords() {
      const map = await load()
      return [...map.values()].flatMap((f) => {
        const r = deriveRecord(f)
        return r ? [r] : []
      })
    },

    async getRecord(id) {
      const f = (await load()).get(id)
      return f ? deriveRecord(f) : null
    },

    async getRecordFile(id) {
      return (await load()).get(id) ?? null
    },

    createRecord(input) {
      return serial(async () => derived(await persist(createRecordFile(input, clock()))))
    },

    async updateRecord(id, input) {
      return derived(await mutate(id, (f) => appendUpdate(f, input, clock())))
    },

    async setResolved(id, resolved) {
      return derived(
        await mutate(id, (f) => (resolved ? appendResolve(f, clock()) : appendReopen(f, clock()))),
      )
    },

    async deleteRecord(id) {
      await mutate(id, (f) => appendDelete(f, clock()))
    },

    async getProfile() {
      const text = await storage.read(VAULT_PATHS.profile)
      return text === null ? createProfileFile({}, clock()) : parseProfileFile(text)
    },

    saveProfile(input) {
      return serial(async () => {
        const next = createProfileFile(input, clock())
        const text = await storage.read(VAULT_PATHS.profile)
        const merged = text === null ? next : mergeProfile(parseProfileFile(text), next)
        await storage.write(VAULT_PATHS.profile, serializeProfileFile(merged))
        return merged
      })
    },

    async reload() {
      await serial(async () => {
        index = null
        await load()
      })
    },
  }
}
