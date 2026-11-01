import { useRouter } from 'expo-router'
import { ProfileForm } from '@/components/ProfileForm'

export default function ProfileEditScreen() {
  const router = useRouter()
  return (
    <ProfileForm title="프로필 수정" onSaved={() => router.back()} onCancel={() => router.back()} />
  )
}
