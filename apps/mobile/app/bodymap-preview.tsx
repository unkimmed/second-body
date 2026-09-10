import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { Text } from '@/components/Text'
import { BodyPartCode, Severity } from '@second-body/shared'
import { BODY_PART_LABELS } from '@/constants/symptom'
import { BodyFigureFigma } from '@/components/bodyMap/BodyFigureFigma'

// Figma 라인아트 + 글로우 통합 미리보기 (머리·목 정면).
// 부위를 탭하면 severity 가 1→5 순환하며 글로우가 표시된다.
export default function BodyMapPreview() {
  const insets = useSafeAreaInsets()
  const [severityMap, setSeverityMap] = useState<Partial<Record<BodyPartCode, Severity>>>({})
  const [selected, setSelected] = useState<BodyPartCode | null>(null)

  function handleSelect(code: BodyPartCode) {
    setSelected(code)
    setSeverityMap((prev) => {
      const cur = prev[code]
      const next = (cur ? (cur % 5) + 1 : 3) as Severity
      return { ...prev, [code]: next }
    })
  }

  function reset() {
    setSeverityMap({})
    setSelected(null)
  }

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, alignItems: 'center' }}
    >
      <Text className="text-lg font-bold text-on-surface mb-1">바디맵 미리보기 (Figma)</Text>
      <Text className="text-xs text-on-surface-variant mb-4">
        부위 탭 → severity 1~5 순환 · 글로우 표시
      </Text>

      <BodyFigureFigma
        width={280}
        severityMap={severityMap}
        selectedCode={selected}
        onSelect={handleSelect}
      />

      {selected && (
        <Text className="mt-3 text-sm text-on-surface">
          {BODY_PART_LABELS[selected]} · 강도 {severityMap[selected]}
        </Text>
      )}

      <TouchableOpacity onPress={reset} className="mt-5 px-4 py-2 rounded-full border border-outline-variant">
        <Text className="text-sm text-on-surface-variant">초기화</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
