import React from 'react'
import { Platform } from 'react-native'
import Svg, { Path, Circle, Rect, G, Defs, RadialGradient, Stop } from 'react-native-svg'
import { BodyPartCode, Severity } from '@second-body/shared'
import { Colors } from '@/constants/theme'
import {
  FIGMA_VIEW_BOX,
  FIGMA_FLIP,
  BODY_OUTLINE_D,
  FIGMA_PARTS,
  GROUP_RECT_AUTHORED,
  isVisibleOn,
  BodyView,
  BodyGroupCode,
} from './bodyMapFigma'

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
const IS_WEB = Platform.OS === 'web'
// 웹에서만 커서 포인터 (react-native-svg 타입에 style 이 없어 spread 로 우회)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WEB_CURSOR: any = IS_WEB ? { style: { cursor: 'pointer' } } : {}

interface Props {
  width?: number
  /** 명시하면 SVG 높이를 이 값으로 (컨테이너 채우기용). 없으면 전체뷰 비율로 계산 */
  height?: number
  /** 줌용 viewBox 오버라이드 (기본: 전체뷰) */
  viewBox?: string
  /** 앞면/뒷면 (기본 front) */
  view?: BodyView
  /** groups: 그룹 사각형 탭(줌인) · parts: 부위 원 탭(시트) — 기본 parts */
  mode?: 'groups' | 'parts'
  severityMap: Partial<Record<BodyPartCode, Severity>>
  selectedCode: BodyPartCode | null
  onSelect: (code: BodyPartCode) => void
  onSelectGroup?: (group: BodyGroupCode) => void
}

// 표시 박스 비율은 전체뷰 기준 고정 (viewBox 만 바뀌며 콘텐츠가 줌됨)
const VB = FIGMA_VIEW_BOX.split(' ').map(Number)
const ASPECT = VB[3] / VB[2]

export function BodyFigureFigma({
  width = 260,
  height,
  viewBox = FIGMA_VIEW_BOX,
  view = 'front',
  mode = 'parts',
  severityMap,
  selectedCode,
  onSelect,
  onSelectGroup,
}: Props) {
  const svgHeight = height ?? Math.round(width * ASPECT)
  // 뒷면은 원본 좌표(뒤에서 본 방향), 앞면은 몸 중심선 기준 미러
  const flip = view === 'front' ? FIGMA_FLIP : undefined

  return (
    <Svg width={width} height={svgHeight} viewBox={viewBox}>
      <Defs>
        {([1, 2, 3, 4, 5] as Severity[]).map((s) => (
          <RadialGradient key={s} id={`fglow-${s}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={GLOW_COLOR[s]} stopOpacity={0.7} />
            <Stop offset="0.55" stopColor={GLOW_COLOR[s]} stopOpacity={0.32} />
            <Stop offset="1" stopColor={GLOW_COLOR[s]} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>

      {/* front=마주 본 사람(미러), back=뒤에서 본 방향(원본) */}
      <G transform={flip}>
        {/* 1. 전신 외곽선 (대칭이라 앞뒤 공용) */}
        <Path d={BODY_OUTLINE_D} stroke={OUTLINE} strokeWidth={2.5} fill="none" />

        {/* 2. 글로우 (해당 view 에 보이는, 증상 있는 부위) */}
        {FIGMA_PARTS.map((p, i) => {
          if (!p.code || !p.anchor || !isVisibleOn(p.code, view)) return null
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

        {/* 3. 얼굴 라인아트 (front 에서만; d 있는 부위) */}
        {view === 'front' &&
          FIGMA_PARTS.map((p, i) =>
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

        {/* 4. 탭 타깃 — groups: 그룹 사각형 전체 / parts: 부위별 원 */}
        {mode === 'groups'
          ? (Object.entries(GROUP_RECT_AUTHORED) as [BodyGroupCode, (typeof GROUP_RECT_AUTHORED)[BodyGroupCode]][]).map(
              ([group, r]) => (
                <Rect
                  key={`gtap-${group}`}
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill="transparent"
                  onPress={() => onSelectGroup?.(group)}
                  {...WEB_CURSOR}
                />
              ),
            )
          : FIGMA_PARTS.map((p, i) => {
              if (!p.code || !p.anchor || !isVisibleOn(p.code, view)) return null
              const code = p.code
              return (
                <Circle
                  key={`tap-${i}`}
                  cx={p.anchor.cx}
                  cy={p.anchor.cy}
                  r={Math.max(p.anchor.r, 12)}
                  fill="transparent"
                  onPress={() => onSelect(code)}
                  {...WEB_CURSOR}
                />
              )
            })}

      </G>
    </Svg>
  )
}
