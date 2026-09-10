import React from 'react'
import Svg, { Ellipse, Rect, G, Defs, RadialGradient, Stop, Circle } from 'react-native-svg'
import { BodyPartCode, Severity } from '@second-body/shared'
import {
  ZoneShape,
  VIEW_BOX,
  VIEW_BOX_W,
  SVG_DISPLAY_W,
  SVG_DISPLAY_H,
  getVisibleZones,
} from './bodyPartZones'
import { Colors } from '@/constants/theme'

// ─── Glow colours (severity 1→5, green→red spectrum, matches severity chips) ──
const GLOW_COLOR: Record<Severity, string> = {
  1: '#86efac',
  2: '#bef264',
  3: '#fde047',
  4: '#fb923c',
  5: '#ef4444',
}
// 후광이 부위보다 얼마나 넓게 번질지
const GLOW_SCALE = 1.9

const BODY_FILL = '#f5ede8' // warm skin silhouette
const ZONE_FILL = 'rgba(69,99,115,0.06)' // near-invisible default (tap affordance)
const ZONE_STROKE = 'rgba(69,99,115,0.15)' // subtle border
const SEL_STROKE = Colors.primary // selected highlight

// ─── Shape helpers ───────────────────────────────────────────────────────────
function renderShape(
  shape: ZoneShape,
  fill: string,
  stroke: string,
  strokeWidth: number,
  key: string,
) {
  if (shape.type === 'ellipse') {
    return (
      <Ellipse
        key={key}
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    )
  }
  return (
    <Rect
      key={key}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      rx={shape.rx ?? 0}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  )
}

/** 부위 중심점 + 대표 반경 (후광 배치용) */
function shapeCenter(shape: ZoneShape): { cx: number; cy: number; r: number } {
  if (shape.type === 'ellipse') {
    return { cx: shape.cx, cy: shape.cy, r: Math.max(shape.rx, shape.ry) }
  }
  return {
    cx: shape.x + shape.width / 2,
    cy: shape.y + shape.height / 2,
    r: Math.max(shape.width, shape.height) / 2,
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  bodyView: 'front' | 'back'
  severityMap: Partial<Record<BodyPartCode, Severity>>
  selectedCode: BodyPartCode | null
}

export function BodyFigureSvg({ bodyView, severityMap, selectedCode }: Props) {
  const zones = getVisibleZones(bodyView)
  // Front view: flip horizontally so the body's left/right match anatomical convention
  const flipTransform =
    bodyView === 'front' ? `translate(${VIEW_BOX_W}, 0) scale(-1, 1)` : undefined

  return (
    <Svg width={SVG_DISPLAY_W} height={SVG_DISPLAY_H} viewBox={VIEW_BOX}>
      {/* Severity 별 후광 그라디언트 정의 */}
      <Defs>
        {([1, 2, 3, 4, 5] as Severity[]).map((s) => (
          <RadialGradient key={s} id={`glow-${s}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={GLOW_COLOR[s]} stopOpacity={0.7} />
            <Stop offset="0.55" stopColor={GLOW_COLOR[s]} stopOpacity={0.32} />
            <Stop offset="1" stopColor={GLOW_COLOR[s]} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>

      <G transform={flipTransform}>
        {/* ── 1. 실루엣: 몸 형태를 피부색으로 (테두리 없음) ── */}
        {zones.map((zone) => {
          const shapes = [zone.shape, ...(zone.extraShapes ?? [])]
          return shapes.map((s, si) =>
            renderShape(s, BODY_FILL, 'none', 0, `sil-${zone.code}-${si}`),
          )
        })}

        {/* ── 2. 후광: 증상 있는 부위 중심에 severity 색 glow (fill 아님) ── */}
        {zones.map((zone) => {
          const severity = severityMap[zone.code]
          if (!severity) return null
          const shapes = [zone.shape, ...(zone.extraShapes ?? [])]
          return shapes.map((s, si) => {
            const { cx, cy, r } = shapeCenter(s)
            return (
              <Circle
                key={`glow-${zone.code}-${si}`}
                cx={cx}
                cy={cy}
                r={r * GLOW_SCALE}
                fill={`url(#glow-${severity})`}
              />
            )
          })
        })}

        {/* ── 3. 존 테두리 + 선택 표시 (severity 채움 없음) ── */}
        {zones.map((zone) => {
          const isSelected = selectedCode === zone.code
          const stroke = isSelected ? SEL_STROKE : ZONE_STROKE
          const sw = isSelected ? 1.2 : 0.5
          const shapes = [zone.shape, ...(zone.extraShapes ?? [])]
          return shapes.map((s, si) =>
            renderShape(s, ZONE_FILL, stroke, sw, `zone-${zone.code}-${si}`),
          )
        })}
      </G>
    </Svg>
  )
}
