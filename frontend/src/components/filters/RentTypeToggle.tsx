export type RentTypeFilter = 'all' | 'jeonse' | 'monthly' | 'sale'

interface RentTypeToggleProps {
  value: RentTypeFilter
  onChange: (value: RentTypeFilter) => void
}

const OPTIONS: Array<{ label: string; value: RentTypeFilter }> = [
  { label: '전체', value: 'all' },
  { label: '전세', value: 'jeonse' },
  { label: '월세', value: 'monthly' },
  { label: '매매', value: 'sale' },
]

export default function RentTypeToggle({ value, onChange }: RentTypeToggleProps) {
  return (
    <fieldset className="toggle-group">
      <legend>거래 유형</legend>
      <div className="toggle-row">
        {OPTIONS.map((option) => (
          <label key={option.value} className="toggle-option">
            <input
              type="radio"
              name="rentType"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
