import { View, TouchableOpacity, Modal } from 'react-native'
import { Text } from '@/components/Text'

type Props = {
  visible: boolean
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({ visible, deleting, onClose, onConfirm }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !deleting && onClose()}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-surface-lowest w-full max-w-sm rounded-xl p-5 gap-4">
          <Text className="text-lg font-bold text-on-surface">삭제 확인</Text>
          <Text className="text-sm text-on-surface-variant">
            이 기록을 정말 삭제할까요? 이 작업은 되돌릴 수 없습니다.
          </Text>
          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity
              onPress={onClose}
              disabled={deleting}
              className="flex-1 py-3 rounded-xl items-center bg-surface-high"
            >
              <Text className="text-on-surface font-medium">취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={deleting}
              className={`flex-1 py-3 rounded-xl items-center bg-red-500 ${deleting ? 'opacity-50' : ''}`}
            >
              <Text className="text-surface font-bold">{deleting ? '삭제 중...' : '삭제'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
