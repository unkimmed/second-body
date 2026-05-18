import { View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { Text } from '../components/Text'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { AvatarGender } from '@second-body/shared'

const GENDER_OPTIONS: { value: AvatarGender; label: string }[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
]

export default function SignUpScreen() {
  const router = useRouter()
  const { signUp } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarName, setAvatarName] = useState('')
  const [gender, setGender] = useState<AvatarGender>('male')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!name || !email || !password || !avatarName) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.')
      return
    }
    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      const { needsEmailConfirm } = await signUp({
        name,
        email,
        password,
        avatarName,
        gender,
      })

      if (needsEmailConfirm) {
        Alert.alert(
          '이메일 인증 필요',
          '가입 확인 이메일을 발송했습니다. 이메일을 확인한 후 로그인해주세요.',
          [{ text: '확인', onPress: () => router.replace('/login') }],
        )
      }
      // 인증 불필요 시 onAuthStateChange → _layout.tsx 에서 자동으로 홈으로 이동
    } catch (e: any) {
      Alert.alert('가입 실패', e.message ?? '회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerClassName="px-6 py-10 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* 타이틀 */}
      <View className="items-center mb-2">
        <Text className="text-2xl font-bold text-on-surface">회원가입</Text>
        <Text className="text-on-surface-variant mt-1 text-sm">
          나만의 Second Body를 만들어보세요
        </Text>
      </View>

      {/* 이름 */}
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-on-surface-variant">이름</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={name}
          onChangeText={setName}
          placeholder="홍길동"
          autoCorrect={false}
        />
      </View>

      {/* 이메일 */}
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-on-surface-variant">이메일</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* 비밀번호 */}
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-on-surface-variant">비밀번호 (6자 이상)</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호를 입력하세요"
          secureTextEntry
        />
      </View>

      {/* 구분선 */}
      <View className="border-t border-outline-variant my-1" />

      {/* 아바타 섹션 */}
      <Text className="text-base font-semibold text-on-surface">아바타 설정</Text>

      {/* 아바타 이름 */}
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-on-surface-variant">아바타 이름</Text>
        <TextInput
          className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
          value={avatarName}
          onChangeText={setAvatarName}
          placeholder="나의 제2의 몸 이름"
          autoCorrect={false}
        />
      </View>

      {/* 아바타 성별 */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-on-surface-variant">아바타 성별</Text>
        <View className="flex-row gap-2">
          {GENDER_OPTIONS.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setGender(value)}
              className={`flex-1 py-3 rounded-xl items-center border ${
                gender === value
                  ? 'bg-primary border-primary'
                  : 'bg-surface-low border-outline-variant'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  gender === value ? 'text-surface' : 'text-on-surface-variant'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 가입 버튼 */}
      <TouchableOpacity
        onPress={handleSignUp}
        disabled={loading}
        className={`py-4 rounded-2xl items-center mt-2 ${loading ? 'opacity-50 bg-primary' : 'bg-primary'}`}
      >
        <Text className="text-surface text-base font-bold">
          {loading ? '처리 중...' : '가입하기'}
        </Text>
      </TouchableOpacity>

      {/* 로그인 링크 */}
      <TouchableOpacity className="items-center" onPress={() => router.replace('/login')}>
        <Text className="text-on-surface-variant text-sm">
          이미 계정이 있으신가요? <Text className="text-primary font-semibold">로그인</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
