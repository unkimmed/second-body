import { useEffect, useState } from 'react'
import {
  BodyPartCode,
  BodyPartGroupCode,
  BODY_PART_GROUP_CHILDREN,
  BODY_PART_TO_GROUP,
} from '@second-body/shared'
import { BODY_PART_LABELS, BODY_PART_GROUP_LABELS } from '@/constants/symptom'

type GroupCode = Exclude<BodyPartGroupCode, 'body'>

const GROUP_ORDER: GroupCode[] = [
  'head_neck',
  'left_arm',
  'right_arm',
  'torso',
  'left_leg',
  'right_leg',
]

// DateField.web 과 동일한 룩으로 맞춘 <select> 스타일
const selectStyle = {
  appearance: 'none' as const,
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderColor: '#b2b2ac',
  borderRadius: 12,
  padding: '12px 40px 12px 16px',
  fontSize: 16,
  color: '#31332f',
  backgroundColor: '#ededed',
  width: '100%',
  boxSizing: 'border-box' as const,
  // 커스텀 드롭다운 화살표 (SVG)
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235e605b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 14px center',
}

type Props = {
  value: BodyPartCode | null
  onChange: (code: BodyPartCode | null) => void
}

/** 웹 전용: 부위 그룹 → 세부 부위 2단계 <select> */
export function BodyPartSelector({ value, onChange }: Props) {
  const [group, setGroup] = useState<GroupCode | ''>(() =>
    value ? BODY_PART_TO_GROUP[value] : '',
  )

  useEffect(() => {
    if (value) setGroup(BODY_PART_TO_GROUP[value])
  }, [value])

  const detailValue = value && group && BODY_PART_TO_GROUP[value] === group ? value : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <select
        value={group}
        onChange={(e) => {
          setGroup((e.target as unknown as { value: string }).value as GroupCode | '')
          onChange(null) // 그룹이 바뀌면 세부 선택 초기화
        }}
        style={selectStyle}
      >
        <option value="">부위 그룹 선택</option>
        {GROUP_ORDER.map((g) => (
          <option key={g} value={g}>
            {BODY_PART_GROUP_LABELS[g]}
          </option>
        ))}
      </select>

      {group !== '' && (
        <select
          value={detailValue}
          onChange={(e) => {
            const code = (e.target as unknown as { value: string }).value
            if (code) onChange(code as BodyPartCode)
          }}
          style={selectStyle}
        >
          <option value="">세부 부위 선택</option>
          {BODY_PART_GROUP_CHILDREN[group].map((code) => (
            <option key={code} value={code}>
              {BODY_PART_LABELS[code]}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
