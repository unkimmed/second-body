import { useState } from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Text } from '@/components/Text'

type Props = {
  /** YYYY-MM-DD */
  value: string
  onChange: (value: string) => void
}

/** Date → 로컬 기준 YYYY-MM-DD (toISOString 은 UTC라 날짜가 밀릴 수 있어 사용하지 않음) */
function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseLocal(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function DateField({ value, onChange }: Props) {
  const [show, setShow] = useState(false)
  const dateValue = value ? parseLocal(value) : new Date()

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== 'ios') setShow(false)
    if (event.type === 'set' && selected) onChange(toLocalISO(selected))
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShow((s) => !s)}
        className="border border-outline-variant rounded-xl px-4 py-3 bg-surface-low flex-row justify-between items-center"
      >
        <Text className="text-base text-on-surface">{value || '날짜 선택'}</Text>
        <Text className="text-on-surface-variant">📅</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && show && (
        <TouchableOpacity onPress={() => setShow(false)} className="self-end mt-1 px-3 py-1.5">
          <Text className="text-primary text-sm font-medium">완료</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
