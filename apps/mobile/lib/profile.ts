import { supabase } from './supabase'
import { AvatarGender, SkinTone } from '@second-body/shared'

export interface Profile {
  name: string
  email: string
  avatarName: string
  skinTone: SkinTone
  gender: AvatarGender
}

/** users + avatars 를 합쳐 프로필로 반환 (클라이언트 anon + RLS: 본인 행) */
export async function fetchProfile(userId: string): Promise<Profile> {
  const [{ data: user }, { data: avatar }] = await Promise.all([
    supabase.from('users').select('name, email').eq('id', userId).single(),
    supabase.from('avatars').select('avatar_name, skin_tone, gender').eq('user_id', userId).single(),
  ])
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    avatarName: avatar?.avatar_name ?? '',
    skinTone: (avatar?.skin_tone ?? 'medium') as SkinTone,
    gender: (avatar?.gender ?? 'male') as AvatarGender,
  }
}

export async function updateProfile(
  userId: string,
  p: { name: string; avatarName: string; skinTone: SkinTone; gender: AvatarGender },
): Promise<void> {
  const { error: e1 } = await supabase.from('users').update({ name: p.name }).eq('id', userId)
  if (e1) throw e1
  const { error: e2 } = await supabase
    .from('avatars')
    .update({ avatar_name: p.avatarName, skin_tone: p.skinTone, gender: p.gender })
    .eq('user_id', userId)
  if (e2) throw e2
}
