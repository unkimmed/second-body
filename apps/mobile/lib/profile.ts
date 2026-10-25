import { AvatarGender, SkinTone } from '@second-body/shared'
import { supabase } from './supabase'
import { vault } from './vault'

export interface Profile {
  name: string
  email: string
  avatarName: string
  skinTone: SkinTone
  gender: AvatarGender
}

/** 로컬 vault 의 profile.json. email 은 로그인을 없애기 전까지 세션에서 가져온다. */
export async function fetchProfile(): Promise<Profile> {
  const [p, { data }] = await Promise.all([vault.getProfile(), supabase.auth.getSession()])
  return {
    name: p.name,
    email: data.session?.user.email ?? '',
    avatarName: p.avatar_name,
    skinTone: p.skin_tone,
    gender: p.gender,
  }
}

export async function updateProfile(p: {
  name: string
  avatarName: string
  skinTone: SkinTone
  gender: AvatarGender
}): Promise<void> {
  await vault.saveProfile({
    name: p.name,
    avatar_name: p.avatarName,
    skin_tone: p.skinTone,
    gender: p.gender,
  })
}
