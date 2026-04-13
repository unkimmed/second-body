import { View, Text, TouchableOpacity } from 'react-native';
import { Symptom } from '@second-body/shared';
import { BODY_PART_LABELS, SEVERITY_COLOR } from '../constants/symptom';

interface Props {
  symptom: Symptom;
  onPress: () => void;
}

/**
 * 증상 카드 컴포넌트
 *
 * React Native에서 className은 NativeWind가 처리해서
 * 웹의 Tailwind와 동일하게 작동함 (단, 웹 전용 CSS 일부는 미지원)
 */
export function SymptomCard({ symptom, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      activeOpacity={0.7}
    >
      {/* 왼쪽 심각도 컬러 바 */}
      <View className="flex-row">
        <View className={`w-1.5 ${SEVERITY_COLOR[symptom.severity]}`} />

        <View className="flex-1 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-800 flex-1 mr-2">
              {symptom.title}
            </Text>
            <Text className="text-xs text-gray-400">{symptom.date}</Text>
          </View>

          <View className="flex-row items-center gap-2 mt-2">
            {/* 신체 부위 태그 */}
            <View className="bg-indigo-50 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-primary font-medium">
                {BODY_PART_LABELS[symptom.body_part]}
              </Text>
            </View>

            {/* 심각도 표시 */}
            <Text className="text-xs text-gray-400">
              심각도 {symptom.severity}/5
            </Text>
          </View>

          {/* 설명 미리보기 */}
          <Text className="text-sm text-gray-500 mt-2" numberOfLines={1}>
            {symptom.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
