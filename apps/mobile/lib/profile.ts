import { AvatarGender, SkinTone } from '@second-body/shared'
import { vault } from './vault'

export interface Profile {
  name: string
  avatarName: string
  skinTone: SkinTone
  gender: AvatarGender
}

/** 로컬 vault 의 profile.json (없으면 기본값) */
export async function fetchProfile(): Promise<Profile> {
  const p = await vault.getProfile()
  return {
    name: p.name,
    avatarName: p.avatar_name,
    skinTone: p.skin_tone,
    gender: p.gender,
  }
}

export async function updateProfile(p: Profile): Promise<void> {
  await vault.saveProfile({
    name: p.name,
    avatar_name: p.avatarName,
    skin_tone: p.skinTone,
    gender: p.gender,
  })
}
