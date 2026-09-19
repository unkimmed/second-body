import { useCallback, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent } from 'react-native'
import { Text } from '@/components/Text'
import { BodyPartCode, Severity } from '@second-body/shared'
import { BODY_PART_GROUP_LABELS } from '@/constants/symptom'
import { Colors } from '@/constants/theme'
import { BodyFigureFigma } from './BodyFigureFigma'
import { SymptomSheet } from './SymptomSheet'
import {
  FULL_RECT,
  groupZoomRect,
  groupPartYExtent,
  BodyGroupCode,
  BodyView,
} from './bodyMapFigma'

type Rect = { x: number; y: number; w: number; h: number }
type Level = 'full' | BodyGroupCode

const rectToViewBox = (r: Rect) => `${r.x} ${r.y} ${r.w} ${r.h}`

interface Props {
  severityMap: Partial<Record<BodyPartCode, Severity>>
  noteMap?: Partial<Record<BodyPartCode, string>>
  onSaveSymptom: (code: BodyPartCode, severity: Severity, note: string) => Promise<void>
  onResolveSymptom?: (code: BodyPartCode) => Promise<void>
}

export function BodyMapView({ severityMap, noteMap, onSaveSymptom, onResolveSymptom }: Props) {
  const [level, setLevel] = useState<Level>('full')
  const [view, setView] = useState<BodyView>('front')
  const [viewBox, setViewBox] = useState(rectToViewBox(FULL_RECT))
  const [sheetCode, setSheetCode] = useState<BodyPartCode | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  const levelRef = useRef<Level>('full')
  const viewRef = useRef<BodyView>('front')
  const curRect = useRef<Rect>(FULL_RECT)
  const progress = useRef(new Animated.Value(1)).current
  const pinchStart = useRef<number | null>(null)

  // 컨테이너 비율에 맞춘 viewBox rect 계산
  // full → 몸 전체를 담되(contain), group → 몸 폭이 가로를 채우도록(fill-width, 좌우 여백 X)
  const rectFor = useCallback(
    (lv: Level, vw: BodyView): Rect => {
      const aspWH = box.w / box.h || FULL_RECT.w / FULL_RECT.h
      if (lv === 'full') {
        let { x, y, w, h } = FULL_RECT
        if (w / h < aspWH) {
          const nw = h * aspWH
          x -= (nw - w) / 2
          w = nw
        } else {
          const nh = w / aspWH
          y -= (nh - h) / 2
          h = nh
        }
        return { x, y, w, h }
      }
      // 몸 폭으로 가로를 채우되(fill-width), 부위 세로범위를 못 담으면 높이를 늘려
      // 그룹의 모든 부위가 보이도록(=팔·다리처럼 세로로 긴 그룹이 과확대되지 않도록)
      const g = groupZoomRect(lv, vw)
      const [y0, y1] = groupPartYExtent(lv, vw)
      const h = Math.max(g.w / aspWH, y1 - y0)
      const w = h * aspWH
      return { x: g.x + g.w / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h }
    },
    [box],
  )

  // ── Zoom animation (viewBox 보간) ──────────────────────────────────────────
  const animateTo = useCallback(
    (target: Rect) => {
      const from = curRect.current
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

  // 레이아웃(컨테이너 크기) 변하면 현재 레벨 기준으로 viewBox 스냅
  useEffect(() => {
    if (!box.w || !box.h) return
    const r = rectFor(levelRef.current, viewRef.current)
    curRect.current = r
    setViewBox(rectToViewBox(r))
  }, [box, rectFor])

  const zoomToGroup = useCallback(
    (g: BodyGroupCode) => {
      levelRef.current = g
      setLevel(g)
      animateTo(rectFor(g, viewRef.current))
    },
    [animateTo, rectFor],
  )

  const zoomToFull = useCallback(() => {
    if (levelRef.current === 'full') return
    levelRef.current = 'full'
    setLevel('full')
    animateTo(rectFor('full', viewRef.current))
  }, [animateTo, rectFor])

  const switchView = useCallback(
    (v: BodyView) => {
      if (viewRef.current === v) return
      viewRef.current = v
      setView(v)
      setSheetCode(null)
      levelRef.current = 'full'
      setLevel('full')
      animateTo(rectFor('full', v))
    },
    [animateTo, rectFor],
  )

  // ── Part tap: L0 → 그룹 줌인, L1 → 증상 시트 ────────────────────────────────
  // L0: 그룹 사각형 탭 → 줌인 / L1: 부위 탭 → 시트
  const handleGroupTap = useCallback((g: BodyGroupCode) => zoomToGroup(g), [zoomToGroup])
  const handlePartTap = useCallback((code: BodyPartCode) => setSheetCode(code), [])

  // ── Sheet handlers ─────────────────────────────────────────────────────────
  const handleClose = useCallback(() => setSheetCode(null), [])
  const handleSave = useCallback(
    async (severity: Severity, note: string) => {
      if (!sheetCode) return
      await onSaveSymptom(sheetCode, severity, note)
      setSheetCode(null)
    },
    [sheetCode, onSaveSymptom],
  )
  const handleResolve = useCallback(async () => {
    if (!sheetCode || !onResolveSymptom) return
    await onResolveSymptom(sheetCode)
    setSheetCode(null)
  }, [sheetCode, onResolveSymptom])

  const onCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setBox({ w: width, h: height })
  }, [])

  return (
    <View style={styles.root}>
      {/* 상단 바: 뒤로 버튼 / 앞뒤 토글 */}
      <View style={styles.bar}>
        {level !== 'full' ? (
          <>
            <TouchableOpacity onPress={zoomToFull} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>← 전체</Text>
            </TouchableOpacity>
            <Text style={styles.groupLabel}>{BODY_PART_GROUP_LABELS[level]}</Text>
          </>
        ) : (
          <View style={styles.toggleRow}>
            {(['front', 'back'] as BodyView[]).map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => switchView(v)}
                style={[styles.toggleBtn, view === v && styles.toggleActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
                  {v === 'front' ? '앞면' : '뒷면'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 캔버스 (핀치 오므리면 축소 — 두 손가락일 때만 responder 획득) */}
      <View
        style={styles.canvas}
        onLayout={onCanvasLayout}
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
        {box.w > 0 && box.h > 0 && (
          <BodyFigureFigma
            width={box.w}
            height={box.h}
            viewBox={viewBox}
            view={view}
            mode={level === 'full' ? 'groups' : 'parts'}
            severityMap={severityMap}
            selectedCode={sheetCode}
            onSelect={handlePartTap}
            onSelectGroup={handleGroupTap}
          />
        )}
      </View>

      <SymptomSheet
        visible={sheetCode !== null}
        partCode={sheetCode}
        initialSeverity={sheetCode ? severityMap[sheetCode] : undefined}
        initialNote={sheetCode ? noteMap?.[sheetCode] : undefined}
        canResolve={sheetCode ? severityMap[sheetCode] !== undefined : false}
        onSave={handleSave}
        onResolve={onResolveSymptom ? handleResolve : undefined}
        onClose={handleClose}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    minHeight: 44,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.surface,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  toggleTextActive: {
    color: Colors.surface,
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
