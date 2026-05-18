import React from 'react'
import Svg, { Ellipse, Rect } from 'react-native-svg'
import { BodyPartCode, Severity } from '@second-body/shared'
import { ZoneShape, VIEW_BOX, SVG_DISPLAY_W, SVG_DISPLAY_H, getVisibleZones } from './bodyPartZones'
import { Colors } from '../../../constants/theme'

// ─── Severity fill colours (semi-transparent) ────────────────────────────────
const SEVERITY_FILL: Record<Severity, string> = {
  1: 'rgba(134, 239, 172, 0.55)',
  2: 'rgba(190, 242, 100, 0.55)',
  3: 'rgba(253, 224,  71, 0.55)',
  4: 'rgba(251, 146,  60, 0.60)',
  5: 'rgba(239,  68,  68, 0.65)',
}

const SEVERITY_STROKE: Record<Severity, string> = {
  1: 'rgba(74, 222, 128, 0.8)',
  2: 'rgba(163, 230, 53, 0.8)',
  3: 'rgba(234, 179, 8, 0.8)',
  4: 'rgba(234, 88, 12, 0.8)',
  5: 'rgba(220, 38, 38, 0.8)',
}

const BODY_FILL = '#f5ede8' // warm skin silhouette
const ZONE_FILL = 'rgba(69,99,115,0.06)' // transparent zone default
const ZONE_STROKE = 'rgba(69,99,115,0.18)' // subtle border
const SEL_STROKE = Colors.primary // selected highlight

// ─── Render one shape ────────────────────────────────────────────────────────
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

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  bodyView: 'front' | 'back'
  severityMap: Partial<Record<BodyPartCode, Severity>>
  selectedCode: BodyPartCode | null
}

export function BodyFigureSvg({ bodyView, severityMap, selectedCode }: Props) {
  const zones = getVisibleZones(bodyView)

  return (
    <Svg width={SVG_DISPLAY_W} height={SVG_DISPLAY_H} viewBox={VIEW_BOX}>
      {/* ── Silhouette pass: fill body shape in skin colour, no border ── */}
      {zones.map((zone) => {
        const shapes = [zone.shape, ...(zone.extraShapes ?? [])]
        return shapes.map((s, si) => renderShape(s, BODY_FILL, 'none', 0, `sil-${zone.code}-${si}`))
      })}

      {/* ── Interactive zone pass: severity colour + stroke ─────────── */}
      {zones.map((zone) => {
        const severity = severityMap[zone.code]
        const isSelected = selectedCode === zone.code

        const fill = severity ? SEVERITY_FILL[severity] : ZONE_FILL
        const stroke = isSelected ? SEL_STROKE : severity ? SEVERITY_STROKE[severity] : ZONE_STROKE
        const sw = isSelected ? 1.2 : severity ? 0.8 : 0.5

        const shapes = [zone.shape, ...(zone.extraShapes ?? [])]
        return shapes.map((s, si) => renderShape(s, fill, stroke, sw, `zone-${zone.code}-${si}`))
      })}
    </Svg>
  )
}
