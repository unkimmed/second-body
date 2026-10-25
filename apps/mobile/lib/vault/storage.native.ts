import { Directory, File, Paths } from 'expo-file-system'
import type { VaultStorage } from '@second-body/shared'

/** iOS/Android: 앱 문서 폴더의 `Second Body/` 아래에 실제 파일로 저장 */
const root = new Directory(Paths.document, 'Second Body')

const TMP = '.tmp'

function fileAt(path: string) {
  return new File(root, ...path.split('/'))
}

function dirAt(path: string) {
  const parts = path.split('/').filter(Boolean)
  return parts.length ? new Directory(root, ...parts) : root
}

export const vaultStorage: VaultStorage = {
  async list(dir) {
    const d = dirAt(dir)
    if (!d.exists) return []
    const names = new Set<string>()
    for (const entry of d.list()) {
      if (!(entry instanceof File)) continue
      // 교체 도중 꺼져 원본 없이 임시 파일만 남은 경우 → 원본 이름으로 보여준다 (read 가 임시 파일을 읽음)
      names.add(entry.name.endsWith(TMP) ? entry.name.slice(0, -TMP.length) : entry.name)
    }
    return [...names]
  },

  async read(path) {
    const f = fileAt(path)
    if (f.exists) return f.text()
    const tmp = fileAt(path + TMP)
    return tmp.exists ? tmp.text() : null
  },

  async write(path, content) {
    const parent = path.split('/').slice(0, -1).join('/')
    dirAt(parent).create({ intermediates: true, idempotent: true })

    // 임시 파일에 다 쓴 뒤 원본과 바꾼다. 중간에 꺼져도 원본이나 임시 파일 중 하나는 온전하다.
    const tmp = fileAt(path + TMP)
    if (tmp.exists) tmp.delete()
    tmp.create()
    tmp.write(content)

    const target = fileAt(path)
    if (target.exists) target.delete()
    tmp.move(target)
  },

  async remove(path) {
    for (const f of [fileAt(path), fileAt(path + TMP)]) {
      if (f.exists) f.delete()
    }
  },
}
