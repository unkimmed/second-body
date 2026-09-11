import { View, ScrollView, TouchableOpacity, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCallback, useRef, useState } from 'react'
import { Text } from '@/components/Text'
import { BodyPartCode, Severity, BODY_PART_TO_GROUP } from '@second-body/shared'
import { BODY_PART_LABELS, BODY_PART_GROUP_LABELS } from '@/constants/symptom'
import { BodyFigureFigma } from '@/components/bodyMap/BodyFigureFigma'
import { FULL_RECT, groupViewRect, BodyGroupCode } from '@/components/bodyMap/bodyMapFigma'

const W = 300
const H = Math.round((W * FULL_RECT.h) / FULL_RECT.w)
const DISPLAY_ASPECT = FULL_RECT.w / FULL_RECT.h

type Rect = { x: number; y: number; w: number; h: number }

const rectToViewBox = (r: Rect) => `${r.x} ${r.y} ${r.w} ${r.h}`

/** 그룹 rect 를 표시 박스 비율에 맞춰 확장 (레터박스 방지) */
function fitAspect(r: Rect): Rect {
  const a = DISPLAY_ASPECT
  let { x, y, w, h } = r
  if (w / h < a) {
    const nw = h * a
    x -= (nw - w) / 2
    w = nw
  } else {
    const nh = w / a
    y -= (nh - h) / 2
    h = nh
  }
  return { x, y, w, h }
}

export default function BodyMapPreview() {
  const insets = useSafeAreaInsets()
  const [severityMap, setSeverityMap] = useState<Partial<Record<BodyPartCode, Severity>>>({})
  const [selected, setSelected] = useState<BodyPartCode | null>(null)
  const [level, setLevel] = useState<'full' | BodyGroupCode>('full')
  const [viewBox, setViewBox] = useState(rectToViewBox(FULL_RECT))

  const levelRef = useRef<'full' | BodyGroupCode>('full')
  const fromRect = useRef<Rect>(FULL_RECT)
  const curRect = useRef<Rect>(FULL_RECT)
  const progress = useRef(new Animated.Value(1)).current
  const pinchStart = useRef<number | null>(null)

  const animateTo = useCallback(
    (target: Rect) => {
      const from = curRect.current
      fromRect.current = from
      progress.stopAnimation()
      progress.setValue(0)
      const id = progress.addListener(({ value }) => {
        const r: Rect = {
          x: from.x + (target.x - from.x) * value,
          y: from.y + (target.y - from.y) * value,
          w: from.w + (target.w - from.w) * value,
          h: from.h + (target.h - from.h) * value,
        }
        curRect.current = r
        setViewBox(rectToViewBox(r))
      })
      Animated.timing(progress, { toValue: 1, duration: 280, useNativeDriver: false }).start(() => {
        progress.removeListener(id)
        curRect.current = target
      })
    },
    [progress],
  )

  const zoomToGroup = useCallback(
    (g: BodyGroupCode) => {
      levelRef.current = g
      setLevel(g)
      animateTo(fitAspect(groupViewRect(g, 'front')))
    },
    [animateTo],
  )

  const zoomToFull = useCallback(() => {
    if (levelRef.current === 'full') return
    levelRef.current = 'full'
    setLevel('full')
    setSelected(null)
    animateTo(FULL_RECT)
  }, [animateTo])

  const handleSelect = useCallback(
    (code: BodyPartCode) => {
      if (levelRef.current === 'full') {
        zoomToGroup(BODY_PART_TO_GROUP[code])
      } else {
        setSelected(code)
        setSeverityMap((prev) => {
          const cur = prev[code]
          const next = (cur ? (cur % 5) + 1 : 3) as Severity
          return { ...prev, [code]: next }
        })
      }
    },
    [zoomToGroup],
  )

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, alignItems: 'center' }}
    >
      <Text className="text-lg font-bold text-on-surface mb-1">바디맵 미리보기 (2단계 줌)</Text>
      <Text className="text-xs text-on-surface-variant mb-3">
        {level === 'full'
          ? '부위 탭 → 해당 영역으로 줌인'
          : `${BODY_PART_GROUP_LABELS[level]} · 부위 탭 → 증상 · 핀치 오므리면 축소`}
      </Text>

      {/* 뒤로/전체 버튼 */}
      <View style={{ height: 34, marginBottom: 8 }}>
        {level !== 'full' && (
          <TouchableOpacity
            onPress={zoomToFull}
            className="px-4 py-1.5 rounded-full bg-primary"
          >
            <Text className="text-surface text-sm font-medium">← 전체</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 핀치 감지 래퍼: 두 손가락일 때만 responder 획득 (단일 탭은 SVG 로 통과) */}
      <View
        onStartShouldSetResponder={() => false}
        onMoveShouldSetResponder={(e) => e.nativeEvent.touches.length === 2}
        onResponderMove={(e) => {
          const t = e.nativeEvent.touches
          if (t.length !== 2) return
          const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY)
          if (pinchStart.current == null) {
            pinchStart.current = d
            return
          }
          // 손가락을 오므리면(거리 감소) 한 단계 축소
          if (d < pinchStart.current * 0.7) {
            zoomToFull()
            pinchStart.current = null
          }
        }}
        onResponderRelease={() => {
          pinchStart.current = null
        }}
        onResponderTerminate={() => {
          pinchStart.current = null
        }}
      >
        <BodyFigureFigma
          width={W}
          viewBox={viewBox}
          severityMap={severityMap}
          selectedCode={selected}
          onSelect={handleSelect}
        />
      </View>

      {selected && (
        <Text className="mt-3 text-sm text-on-surface">
          {BODY_PART_LABELS[selected]} · 강도 {severityMap[selected]}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => {
          setSeverityMap({})
          setSelected(null)
        }}
        className="mt-5 px-4 py-2 rounded-full border border-outline-variant"
      >
        <Text className="text-sm text-on-surface-variant">글로우 초기화</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
