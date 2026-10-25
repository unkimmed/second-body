import { AvatarGender, SkinTone } from '../types/symptom'
import { ProfileFile, VaultFile, VAULT_SCHEMA_VERSION } from '../types/vault'
import { uuidv7 } from './uuid'

const SKIN_TONES: readonly SkinTone[] = ['light', 'medium_light', 'medium', 'medium_dark', 'dark']
const GENDERS: readonly AvatarGender[] = ['male', 'female']

function asObject(text: string, where: string): Record<string, unknown> {
  const v: unknown = JSON.parse(text)
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new Error(`${where}: 객체가 아닙니다`)
  }
  const obj = v as Record<string, unknown>
  if (obj.schema_version !== VAULT_SCHEMA_VERSION) {
    throw new Error(`${where}: 지원하지 않는 schema_version (${String(obj.schema_version)})`)
  }
  return obj
}

// ---- vault.json ----

export function createVaultFile(now: Date = new Date()): VaultFile {
  return {
    schema_version: VAULT_SCHEMA_VERSION,
    vault_id: uuidv7(now.getTime()),
    created_at: now.toISOString(),
  }
}

export function serializeVaultFile(file: VaultFile): string {
  const ordered = {
    schema_version: file.schema_version,
    vault_id: file.vault_id,
    created_at: file.created_at,
  }
  return JSON.stringify(ordered, null, 2) + '\n'
}

export function parseVaultFile(text: string): VaultFile {
  const v = asObject(text, 'parseVaultFile')
  if (typeof v.vault_id !== 'string' || typeof v.created_at !== 'string') {
    throw new Error('parseVaultFile: vault_id/created_at 누락')
  }
  return { schema_version: VAULT_SCHEMA_VERSION, vault_id: v.vault_id, created_at: v.created_at }
}

// ---- profile.json ----

export function createProfileFile(
  input: Partial<Pick<ProfileFile, 'name' | 'avatar_name' | 'skin_tone' | 'gender'>> = {},
  now: Date = new Date(),
): ProfileFile {
  return {
    schema_version: VAULT_SCHEMA_VERSION,
    name: input.name ?? '',
    avatar_name: input.avatar_name ?? '',
    skin_tone: input.skin_tone ?? 'medium',
    gender: input.gender ?? 'male',
    updated_at: now.toISOString(),
  }
}

export function serializeProfileFile(file: ProfileFile): string {
  const ordered = {
    schema_version: file.schema_version,
    name: file.name,
    avatar_name: file.avatar_name,
    skin_tone: file.skin_tone,
    gender: file.gender,
    updated_at: file.updated_at,
  }
  return JSON.stringify(ordered, null, 2) + '\n'
}

export function parseProfileFile(text: string): ProfileFile {
  const v = asObject(text, 'parseProfileFile')
  const { name, avatar_name, skin_tone, gender, updated_at } = v
  if (typeof name !== 'string' || typeof avatar_name !== 'string') {
    throw new Error('parseProfileFile: name/avatar_name 형식 오류')
  }
  if (!SKIN_TONES.includes(skin_tone as SkinTone))
    throw new Error('parseProfileFile: skin_tone 오류')
  if (!GENDERS.includes(gender as AvatarGender)) throw new Error('parseProfileFile: gender 오류')
  if (typeof updated_at !== 'string') throw new Error('parseProfileFile: updated_at 누락')
  return {
    schema_version: VAULT_SCHEMA_VERSION,
    name,
    avatar_name,
    skin_tone: skin_tone as SkinTone,
    gender: gender as AvatarGender,
    updated_at,
  }
}

/** 파일 전체 단위로 updated_at 이 큰 쪽이 이긴다. 같으면 직렬화 문자열로 순서를 고정한다. */
export function mergeProfile(a: ProfileFile, b: ProfileFile): ProfileFile {
  if (a.updated_at !== b.updated_at) return a.updated_at > b.updated_at ? a : b
  return serializeProfileFile(a) >= serializeProfileFile(b) ? a : b
}
