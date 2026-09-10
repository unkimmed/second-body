import React from 'react'
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg'
import { BodyPartCode, Severity } from '@second-body/shared'
import { Colors } from '@/constants/theme'
import { FIGMA_VIEW_BOX, FIGMA_FLIP, BODY_OUTLINE_D, FIGMA_PARTS } from './bodyMapFigma'

const GLOW_COLOR: Record<Severity, string> = {
  1: '#86efac',
  2: '#bef264',
  3: '#fde047',
  4: '#fb923c',
  5: '#ef4444',
}
const GLOW_SCALE = 1.9

const OUTLINE = '#31332f'
const FACE_STROKE = '#9a9a9a'

interface Props {
  width?: number
  severityMap: Partial<Record<BodyPartCode, Severity>>
  selectedCode: BodyPartCode | null
  onSelect: (code: BodyPartCode) => void
}

// viewBox "230 100 545 1050" → 세로/가로 비율
const VB = FIGMA_VIEW_BOX.split(' ').map(Number)
const ASPECT = VB[3] / VB[2]

export function BodyFigureFigma({ width = 260, severityMap, selectedCode, onSelect }: Props) {
  const height = Math.round(width * ASPECT)

  return (
    <Svg width={width} height={height} viewBox={FIGMA_VIEW_BOX}>
      <Defs>
        {([1, 2, 3, 4, 5] as Severity[]).map((s) => (
          <RadialGradient key={s} id={`fglow-${s}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={GLOW_COLOR[s]} stopOpacity={0.7} />
            <Stop offset="0.55" stopColor={GLOW_COLOR[s]} stopOpacity={0.32} />
            <Stop offset="1" stopColor={GLOW_COLOR[s]} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>

      {/* 몸 중심선 기준 좌우 반전 (정면 = 마주 본 사람) */}
      <G transform={FIGMA_FLIP}>
        {/* 1. 전신 외곽선 */}
        <Path d={BODY_OUTLINE_D} stroke={OUTLINE} strokeWidth={2.5} fill="none" />

        {/* 2. 글로우 (증상 있는 부위 앵커) */}
        {FIGMA_PARTS.map((p, i) => {
          if (!p.code || !p.anchor) return null
          const sev = severityMap[p.code]
          if (!sev) return null
          return (
            <Circle
              key={`glow-${i}`}
              cx={p.anchor.cx}
              cy={p.anchor.cy}
              r={p.anchor.r * GLOW_SCALE}
              fill={`url(#fglow-${sev})`}
            />
          )
        })}

        {/* 3. 부위 라인아트 (d 있는 것만; 선택 시 primary 강조) */}
        {FIGMA_PARTS.map((p, i) =>
          p.d ? (
            <Path
              key={`line-${i}`}
              d={p.d}
              stroke={p.code && p.code === selectedCode ? Colors.primary : FACE_STROKE}
              strokeWidth={p.code && p.code === selectedCode ? 1.6 : 1}
              fill="none"
            />
          ) : null,
        )}

        {/* 4. 탭 타깃 (투명 원, 부위만) */}
        {FIGMA_PARTS.map((p, i) => {
          if (!p.code || !p.anchor) return null
          const code = p.code
          return (
            <Circle
              key={`tap-${i}`}
              cx={p.anchor.cx}
              cy={p.anchor.cy}
              r={Math.max(p.anchor.r, 12)}
              fill="transparent"
              onPress={() => onSelect(code)}
            />
          )
        })}
      </G>
    </Svg>
  )
}
