import { useCallback, useRef, useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent } from 'react-native'
import { Text } from '@/components/Text'
import { BodyPartCode, Severity, BODY_PART_TO_GROUP } from '@second-body/shared'
import { BODY_PART_GROUP_LABELS } from '@/constants/symptom'
import { Colors } from '@/constants/theme'
import { BodyFigureFigma } from './BodyFigureFigma'
import { SymptomSheet } from './SymptomSheet'
import {
  FULL_RECT,
  DISPLAY_ASPECT_HW,
  groupViewRect,
  BodyGroupCode,
  BodyView,
} from './bodyMapFigma'

type Rect = { x: number; y: number; w: number; h: number }

const rectToViewBox = (r: Rect) => `${r.x} ${r.y} ${r.w} ${r.h}`
const DISPLAY_ASPECT_WH = FULL_RECT.w / FULL_RECT.h

/** 그룹 rect 를 표시 박스 비율에 맞춰 확장 (레터박스 방지) */
function fitAspect(r: Rect): Rect {
  let { x, y, w, h } = r
  if (w / h < DISPLAY_ASPECT_WH) {
    const nw = h * DISPLAY_ASPECT_WH
    x -= (nw - w) / 2
    w = nw
  } else {
    const nh = w / DISPLAY_ASPECT_WH
    y -= (nh - h) / 2
    h = nh
  }
  return { x, y, w, h }
}

interface Props {
  severityMap: Partial<Record<BodyPartCode, Severity>>
  noteMap?: Partial<Record<BodyPartCode, string>>
  onSaveSymptom: (code: BodyPartCode, severity: Severity, note: string) => Promise<void>
  onResolveSymptom?: (code: BodyPartCode) => Promise<void>
}

export function BodyMapView({ severityMap, noteMap, onSaveSymptom, onResolveSymptom }: Props) {
  const [level, setLevel] = useState<'full' | BodyGroupCode>('full')
  const [view, setView] = useState<BodyView>('front')
  const [viewBox, setViewBox] = useState(rectToViewBox(FULL_RECT))
  const [sheetCode, setSheetCode] = useState<BodyPartCode | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  const levelRef = useRef<'full' | BodyGroupCode>('full')
  const viewRef = useRef<BodyView>('front')
  const curRect = useRef<Rect>(FULL_RECT)
  const progress = useRef(new Animated.Value(1)).current
  const pinchStart = useRef<number | null>(null)

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

  const zoomToGroup = useCallback(
    (g: BodyGroupCode) => {
      levelRef.current = g
      setLevel(g)
      animateTo(fitAspect(groupViewRect(g, viewRef.current)))
    },
    [animateTo],
  )

  const zoomToFull = useCallback(() => {
    if (levelRef.current === 'full') return
    levelRef.current = 'full'
    setLevel('full')
    animateTo(FULL_RECT)
  }, [animateTo])

  const switchView = useCallback(
    (v: BodyView) => {
      if (viewRef.current === v) return
      viewRef.current = v
      setView(v)
      setSheetCode(null)
      zoomToFull()
    },
    [zoomToFull],
  )

  // ── Part tap: L0 → 그룹 줌인, L1 → 증상 시트 ────────────────────────────────
  const handlePartTap = useCallback(
    (code: BodyPartCode) => {
      if (levelRef.current === 'full') {
        zoomToGroup(BODY_PART_TO_GROUP[code])
      } else {
        setSheetCode(code)
      }
    },
    [zoomToGroup],
  )

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

  // contain: 가용 영역 안에 몸이 다 들어오게
  const figW = box.w && box.h ? Math.floor(Math.min(box.w, box.h / DISPLAY_ASPECT_HW)) : 0

  return (
    <View style={styles.root}>
      {/* 상단 바: 뒤로 버튼 / 안내 */}
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
        {figW > 0 && (
          <BodyFigureFigma
            width={figW}
            viewBox={viewBox}
            view={view}
            severityMap={severityMap}
            selectedCode={sheetCode}
            onSelect={handlePartTap}
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
    backgroundColor: Colors.surfaceContainerLow,
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
