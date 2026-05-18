import React, { useRef, useState, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native'
import { Text } from '../../../components/Text'
import { BodyPartCode, Severity } from '@second-body/shared'
import { SVG_DISPLAY_W, SVG_DISPLAY_H, VIEW_BOX_W, VIEW_BOX_H, hitTestZones } from './bodyPartZones'
import { BodyFigureSvg } from './BodyFigureSvg'
import { SymptomSheet } from './SymptomSheet'
import { Colors } from '../../../constants/theme'

const MIN_SCALE = 0.6
const MAX_SCALE = 6
const SPRING_CFG = { useNativeDriver: false, damping: 18, stiffness: 180, mass: 0.6 }
const TAP_MAX_DIST = 10 // px — max travel to still count as a tap

// ── Distance between two touches in PAGE coordinates ─────────────────────────
function pageDist(a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) {
  return Math.sqrt((b.pageX - a.pageX) ** 2 + (b.pageY - a.pageY) ** 2)
}

// ── Touch state ───────────────────────────────────────────────────────────────
type TouchState =
  | {
      mode: 'single'
      // page coords at start (used for delta calc — invariant to reference frame)
      startPageX: number
      startPageY: number
      // canvas coords at start (used for tap hit-test)
      startCanvasX: number
      startCanvasY: number
      savedTx: number
      savedTy: number
      moved: boolean
    }
  | {
      mode: 'pinch'
      startDist: number
      // Pinch midpoint in CANVAS coords (relative to canvas top-left)
      startMidX: number
      startMidY: number
      // SVG focal point in SVG-display-centered coords (invariant throughout pinch)
      fpX: number
      fpY: number
      savedScale: number
      savedTx: number
      savedTy: number
    }

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  severityMap: Partial<Record<BodyPartCode, Severity>>
  onSaveSymptom: (code: BodyPartCode, severity: Severity, note: string) => Promise<void>
}

export function BodyMapView({ severityMap, onSaveSymptom }: Props) {
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front')
  const [selectedCode, setSelectedCode] = useState<BodyPartCode | null>(null)
  const [sheetCode, setSheetCode] = useState<BodyPartCode | null>(null)
  const bodyViewRef = useRef<'front' | 'back'>('front')

  // ── Animated values (JS-thread, updated via setValue every gesture frame) ──
  const scaleAnim = useRef(new Animated.Value(1)).current
  const txAnim = useRef(new Animated.Value(0)).current
  const tyAnim = useRef(new Animated.Value(0)).current

  // ── Current transform state (plain refs for synchronous gesture math) ───────
  const scale = useRef(1)
  const txVal = useRef(0)
  const tyVal = useRef(0)

  // ── Canvas screen position (updated after layout via measure) ────────────────
  const canvasRef = useRef<View>(null)
  const canvasPageX = useRef(0)
  const canvasPageY = useRef(0)
  const cW = useRef(0)
  const cH = useRef(0)

  // ── Touch tracking ────────────────────────────────────────────────────────
  const touch = useRef<TouchState | null>(null)
  const lastTapAt = useRef(0)

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Convert absolute page coords → canvas-relative coords */
  const toCanvas = useCallback(
    (pageX: number, pageY: number) => ({
      x: pageX - canvasPageX.current,
      y: pageY - canvasPageY.current,
    }),
    [],
  )

  const stopAnims = useCallback(() => {
    scaleAnim.stopAnimation()
    txAnim.stopAnimation()
    tyAnim.stopAnimation()
  }, [scaleAnim, txAnim, tyAnim])

  const resetView = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, ...SPRING_CFG }),
      Animated.spring(txAnim, { toValue: 0, ...SPRING_CFG }),
      Animated.spring(tyAnim, { toValue: 0, ...SPRING_CFG }),
    ]).start(() => {
      scale.current = 1
      txVal.current = 0
      tyVal.current = 0
    })
  }, [scaleAnim, txAnim, tyAnim])

  /** Build pinch state for the given two touch points */
  const initPinch = useCallback(
    (
      ts: { pageX: number; pageY: number }[],
      savedScale: number,
      savedTx: number,
      savedTy: number,
    ): Extract<TouchState, { mode: 'pinch' }> => {
      const dist = pageDist(ts[0], ts[1])
      const midPage = { x: (ts[0].pageX + ts[1].pageX) / 2, y: (ts[0].pageY + ts[1].pageY) / 2 }
      const mid = toCanvas(midPage.x, midPage.y)

      // Focal point in SVG-display-centred coords
      // This is the SVG point currently under the pinch midpoint — kept fixed throughout.
      const fx = mid.x - cW.current / 2 // midpoint relative to canvas centre
      const fy = mid.y - cH.current / 2
      const fpX = (fx - savedTx) / savedScale // into SVG-centred space
      const fpY = (fy - savedTy) / savedScale

      return {
        mode: 'pinch',
        startDist: dist,
        startMidX: mid.x,
        startMidY: mid.y,
        fpX,
        fpY,
        savedScale,
        savedTx,
        savedTy,
      }
    },
    [toCanvas],
  )

  // ── Responder: finger(s) down ─────────────────────────────────────────────
  const onGrant = useCallback(
    (e: GestureResponderEvent) => {
      stopAnims()
      const ts = e.nativeEvent.touches

      if (ts.length >= 2) {
        touch.current = initPinch(ts, scale.current, txVal.current, tyVal.current)
        return
      }

      // Single finger — check for double-tap
      const now = Date.now()
      if (now - lastTapAt.current < 280) {
        lastTapAt.current = 0
        touch.current = null
        resetView()
        return
      }
      lastTapAt.current = now

      const cvs = toCanvas(ts[0].pageX, ts[0].pageY)
      touch.current = {
        mode: 'single',
        startPageX: ts[0].pageX,
        startPageY: ts[0].pageY,
        startCanvasX: cvs.x,
        startCanvasY: cvs.y,
        savedTx: txVal.current,
        savedTy: tyVal.current,
        moved: false,
      }
    },
    [stopAnims, resetView, initPinch, toCanvas],
  )

  // ── Responder: move ───────────────────────────────────────────────────────
  const onMove = useCallback(
    (e: GestureResponderEvent) => {
      const ts = e.nativeEvent.touches
      const t = touch.current
      if (!t) return

      // ── Transition single → pinch when second finger appears ──────────────
      if (ts.length >= 2 && t.mode === 'single') {
        touch.current = initPinch(ts, scale.current, txVal.current, tyVal.current)
        return
      }

      if (ts.length >= 2 && t.mode === 'pinch') {
        // ── Pinch update ───────────────────────────────────────────────────
        const newDist = pageDist(ts[0], ts[1])
        const ratio = newDist / t.startDist
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.savedScale * ratio))

        // Current midpoint in canvas coords
        const newMid = toCanvas((ts[0].pageX + ts[1].pageX) / 2, (ts[0].pageY + ts[1].pageY) / 2)
        const newFx = newMid.x - cW.current / 2 // relative to canvas centre

        // Correct formula: the SVG focal point (fpX) maps to the current midpoint.
        // Container_x = cW/2 + fpX * newScale + newTx
        // → newTx = newFx - fpX * newScale
        const newTx = newFx - t.fpX * newScale
        const newFy = newMid.y - cH.current / 2
        const newTy = newFy - t.fpY * newScale

        scaleAnim.setValue(newScale)
        txAnim.setValue(newTx)
        tyAnim.setValue(newTy)
        scale.current = newScale
        txVal.current = newTx
        tyVal.current = newTy
        return
      }

      if (ts.length === 1 && t.mode === 'single') {
        // ── Single-finger pan ──────────────────────────────────────────────
        const dx = ts[0].pageX - t.startPageX
        const dy = ts[0].pageY - t.startPageY
        if (Math.sqrt(dx * dx + dy * dy) > TAP_MAX_DIST) t.moved = true
        const newTx = t.savedTx + dx
        const newTy = t.savedTy + dy
        txAnim.setValue(newTx)
        tyAnim.setValue(newTy)
        txVal.current = newTx
        tyVal.current = newTy
      }
    },
    [initPinch, toCanvas, scaleAnim, txAnim, tyAnim],
  )

  // ── Responder: release ────────────────────────────────────────────────────
  const onRelease = useCallback((e: GestureResponderEvent) => {
    const t = touch.current
    const remaining = e.nativeEvent.touches
    if (remaining.length === 0) touch.current = null

    if (!t || t.mode !== 'single' || t.moved) return

    // Tap — convert canvas coords to SVG viewBox coords
    // Canvas coord of touch:
    const lx = t.startCanvasX
    const ly = t.startCanvasY
    const s = scale.current
    // SVG display space (from SVG top-left):
    //   dispX = SVG_W/2 + (lx - cW/2 - txVal) / s
    const dispX = SVG_DISPLAY_W / 2 + (lx - cW.current / 2 - txVal.current) / s
    const dispY = SVG_DISPLAY_H / 2 + (ly - cH.current / 2 - tyVal.current) / s
    // Map to viewBox:
    const svgX = (dispX * VIEW_BOX_W) / SVG_DISPLAY_W
    const svgY = (dispY * VIEW_BOX_H) / SVG_DISPLAY_H

    const hit = hitTestZones(svgX, svgY, bodyViewRef.current)
    if (hit) {
      setSelectedCode(hit)
      setSheetCode(hit)
    }
  }, [])

  // ── Layout: measure canvas page position for coordinate conversion ─────────
  const onContainerLayout = useCallback((_e: LayoutChangeEvent) => {
    canvasRef.current?.measure((_x, _y, w, h, px, py) => {
      canvasPageX.current = px
      canvasPageY.current = py
      cW.current = w
      cH.current = h
    })
  }, [])

  const switchView = useCallback((v: 'front' | 'back') => {
    bodyViewRef.current = v
    setBodyView(v)
  }, [])

  // ── Sheet handlers ─────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setSheetCode(null)
    setSelectedCode(null)
  }, [])

  const handleSave = useCallback(
    async (severity: Severity, note: string) => {
      if (!sheetCode) return
      await onSaveSymptom(sheetCode, severity, note)
      setSheetCode(null)
      setSelectedCode(null)
    },
    [sheetCode, onSaveSymptom],
  )

  return (
    <View style={styles.root}>
      {/* Front / Back toggle */}
      <View style={styles.toggleRow}>
        {(['front', 'back'] as const).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, bodyView === v && styles.toggleActive]}
            onPress={() => switchView(v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, bodyView === v && styles.toggleTextActive]}>
              {v === 'front' ? '앞면' : '뒷면'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>핀치로 확대 · 두 번 탭하면 초기화</Text>

      {/* Touch canvas */}
      <View
        ref={canvasRef}
        style={styles.canvas}
        onLayout={onContainerLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminate={onRelease}
        collapsable={false}
      >
        <Animated.View
          style={[
            styles.svgWrap,
            { transform: [{ translateX: txAnim }, { translateY: tyAnim }, { scale: scaleAnim }] },
          ]}
        >
          <BodyFigureSvg
            bodyView={bodyView}
            severityMap={severityMap}
            selectedCode={selectedCode}
          />
        </Animated.View>
      </View>

      {/* Reset zoom button */}
      <TouchableOpacity style={styles.resetBtn} onPress={resetView} activeOpacity={0.7}>
        <Text style={styles.resetText}>↺</Text>
      </TouchableOpacity>

      <SymptomSheet
        visible={sheetCode !== null}
        partCode={sheetCode}
        initialSeverity={sheetCode ? severityMap[sheetCode] : undefined}
        onSave={handleSave}
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  toggleBtn: {
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  toggleTextActive: { color: Colors.surface },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    opacity: 0.55,
    marginBottom: 6,
  },
  canvas: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrap: {
    width: SVG_DISPLAY_W,
    height: SVG_DISPLAY_H,
  },
  resetBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  resetText: {
    fontSize: 18,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
})
