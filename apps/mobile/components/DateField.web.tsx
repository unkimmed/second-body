type Props = {
  /** YYYY-MM-DD */
  value: string
  onChange: (value: string) => void
}

/** 웹에서는 브라우저 기본 date input 을 사용한다 (native picker 는 웹 미지원) */
export function DateField({ value, onChange }: Props) {
  return (
    <input
      type="date"
      value={value}
      max={new Date().toLocaleDateString('en-CA')}
      onChange={(e) => onChange((e.target as unknown as { value: string }).value)}
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#c4c4c4',
        borderRadius: 12,
        padding: '12px 16px',
        fontSize: 16,
        color: '#1a1a1a',
        backgroundColor: '#f0f0f0',
        width: '100%',
        boxSizing: 'border-box',
      }}
    />
  )
}
