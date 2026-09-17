import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text } from '@/components/Text'
import { Colors } from '@/constants/theme'
import { AvatarGender, SkinTone } from '@second-body/shared'
import { useAuth } from '@/lib/AuthContext'
import { fetchProfile, updateProfile } from '@/lib/profile'

const SKIN_TONES: { value: SkinTone; label: string; color: string }[] = [
  { value: 'light', label: '밝음', color: '#f5d6c6' },
  { value: 'medium_light', label: '중간밝음', color: '#e8b591' },
  { value: 'medium', label: '중간', color: '#c68642' },
  { value: 'medium_dark', label: '중간어둠', color: '#8d5524' },
  { value: 'dark', label: '어두움', color: '#5c3a21' },
]

const GENDERS: { value: AvatarGender; label: string }[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
]

export default function ProfileEditScreen() {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [avatarName, setAvatarName] = useState('')
  const [skinTone, setSkinTone] = useState<SkinTone>('medium')
  const [gender, setGender] = useState<AvatarGender>('male')

  useEffect(() => {
    if (!userId) return
    fetchProfile(userId)
      .then((p) => {
        setName(p.name)
        setAvatarName(p.avatarName)
        setSkinTone(p.skinTone)
        setGender(p.gender)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  async function save() {
    if (!userId) return
    if (!name.trim() || !avatarName.trim()) {
      setError('이름과 아바타 이름을 입력해주세요.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await updateProfile(userId, { name: name.trim(), avatarName: avatarName.trim(), skinTone, gender })
      router.back()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`저장 실패: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-lowest">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-xl font-bold text-on-surface">프로필 수정</Text>

      {/* 이름 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-1">이름</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={name}
          onChangeText={setName}
          placeholder="이름"
        />
      </View>

      {/* 아바타 이름 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-1">아바타 이름 (제2의 나)</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={avatarName}
          onChangeText={setAvatarName}
          placeholder="아바타 이름"
        />
      </View>

      {/* 피부톤 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-2">피부톤</Text>
        <View className="flex-row gap-3">
          {SKIN_TONES.map((t) => (
            <TouchableOpacity key={t.value} onPress={() => setSkinTone(t.value)} className="items-center">
              <View
                className="w-11 h-11 rounded-full"
                style={{
                  backgroundColor: t.color,
                  borderWidth: skinTone === t.value ? 3 : 1,
                  borderColor: skinTone === t.value ? Colors.primary : Colors.outlineVariant,
                }}
              />
              <Text className="text-[10px] text-on-surface-variant mt-1">{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 성별 */}
      <View>
        <Text className="text-sm font-medium text-on-surface-variant mb-2">성별</Text>
        <View className="flex-row gap-2">
          {GENDERS.map((g) => {
            const active = gender === g.value
            return (
              <TouchableOpacity
                key={g.value}
                onPress={() => setGender(g.value)}
                className={`flex-1 py-2.5 rounded-xl items-center border ${
                  active ? 'bg-primary border-primary' : 'bg-surface-lowest border-outline-variant'
                }`}
              >
                <Text className={active ? 'text-surface font-medium' : 'text-on-surface-variant'}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      )}

      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={saving}
          className="flex-1 py-3.5 rounded-2xl items-center border border-outline-variant"
        >
          <Text className="text-on-surface-variant font-medium">취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          className={`flex-1 py-3.5 rounded-2xl items-center bg-primary ${saving ? 'opacity-50' : ''}`}
        >
          <Text className="text-surface font-bold">{saving ? '저장 중...' : '저장'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
