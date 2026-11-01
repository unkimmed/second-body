import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View } from 'react-native'
import { ProfileForm } from '@/components/ProfileForm'

/** 첫 실행: profile.json 이 없으면 _layout 이 이 화면으로 보낸다 */
export default function OnboardingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-surface-lowest" style={{ paddingTop: insets.top }}>
      <ProfileForm
        title="시작하기"
        subtitle="나만의 Second Body를 만들어보세요. 기록은 이 기기에만 저장돼요."
        submitLabel="시작하기"
        onSaved={() => router.replace('/')}
      />
    </View>
  )
}
