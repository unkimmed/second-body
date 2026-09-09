import { View } from 'react-native'
import { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
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

const PLACEHOLDER_COLOR = '#9ca3af'

type Props = {
  value: BodyPartCode | null
  onChange: (code: BodyPartCode | null) => void
}

/**
 * 2단계 부위 선택: 먼저 부위 그룹(머리·목, 왼쪽 팔 …) 셀렉트박스를 고르고
 * 그 하위의 세부 부위 셀렉트박스를 선택한다.
 */
export function BodyPartSelector({ value, onChange }: Props) {
  const [group, setGroup] = useState<GroupCode | ''>(() =>
    value ? BODY_PART_TO_GROUP[value] : '',
  )

  // 외부에서 값이 주입되면(예: 수정 화면 로딩) 해당 그룹을 펼쳐준다
  useEffect(() => {
    if (value) setGroup(BODY_PART_TO_GROUP[value])
  }, [value])

  // 현재 값이 선택된 그룹에 속할 때만 세부 셀렉트에 반영
  const detailValue = value && group && BODY_PART_TO_GROUP[value] === group ? value : ''

  return (
    <View className="gap-3">
      {/* 1단계: 부위 그룹 */}
      <View className="border border-outline-variant rounded-xl bg-surface-low overflow-hidden">
        <Picker
          selectedValue={group}
          onValueChange={(g) => {
            setGroup(g as GroupCode | '')
            onChange(null) // 그룹이 바뀌면 세부 선택 초기화
          }}
        >
          <Picker.Item label="부위 그룹 선택" value="" color={PLACEHOLDER_COLOR} />
          {GROUP_ORDER.map((g) => (
            <Picker.Item key={g} label={BODY_PART_GROUP_LABELS[g]} value={g} />
          ))}
        </Picker>
      </View>

      {/* 2단계: 선택한 그룹의 세부 부위 */}
      {group !== '' && (
        <View className="border border-outline-variant rounded-xl bg-surface-low overflow-hidden">
          <Picker
            selectedValue={detailValue}
            onValueChange={(code) => {
              if (code) onChange(code as BodyPartCode)
            }}
          >
            <Picker.Item label="세부 부위 선택" value="" color={PLACEHOLDER_COLOR} />
            {BODY_PART_GROUP_CHILDREN[group].map((code) => (
              <Picker.Item key={code} label={BODY_PART_LABELS[code]} value={code} />
            ))}
          </Picker>
        </View>
      )}
    </View>
  )
}
