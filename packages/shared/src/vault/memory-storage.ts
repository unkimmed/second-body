import { VaultStorage } from './storage'

/** 메모리 저장소. 테스트와 미리보기용 */
export function createMemoryStorage(initial: Record<string, string> = {}): VaultStorage & {
  files: Map<string, string>
} {
  const files = new Map(Object.entries(initial))
  return {
    files,
    async list(dir) {
      const prefix = `${dir}/`
      return [...files.keys()]
        .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
        .map((p) => p.slice(prefix.length))
    },
    async read(path) {
      return files.get(path) ?? null
    },
    async write(path, content) {
      files.set(path, content)
    },
    async remove(path) {
      files.delete(path)
    },
  }
}
