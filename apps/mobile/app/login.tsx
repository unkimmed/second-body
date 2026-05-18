import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Text } from '../components/Text'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
      // onAuthStateChange → _layout.tsx 에서 자동으로 홈으로 이동
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message ?? '이메일 또는 비밀번호를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-lowest"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-6 gap-6">
        {/* 타이틀 */}
        <View className="items-center mb-4">
          <Text className="text-3xl font-bold text-on-surface">Second Body</Text>
          <Text className="text-on-surface-variant mt-2">나의 몸을 기록하세요</Text>
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
          <Text className="text-sm font-medium text-on-surface-variant">비밀번호</Text>
          <TextInput
            className="border border-outline-variant rounded-xl px-4 py-3 text-base bg-surface-low"
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호를 입력하세요"
            secureTextEntry
          />
        </View>

        {/* 로그인 버튼 */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`py-4 rounded-2xl items-center ${loading ? 'opacity-50 bg-primary' : 'bg-primary'}`}
        >
          <Text className="text-surface text-base font-bold">
            {loading ? '로그인 중...' : '로그인'}
          </Text>
        </TouchableOpacity>

        {/* 회원가입 링크 */}
        <TouchableOpacity className="items-center" onPress={() => router.push('/signup')}>
          <Text className="text-on-surface-variant text-sm">
            아직 계정이 없으신가요? <Text className="text-primary font-semibold">회원가입</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
