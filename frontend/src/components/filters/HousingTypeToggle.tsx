export type HousingTypeFilter = 'apartment' | 'officetel'

interface HousingTypeToggleProps {
  value: HousingTypeFilter
  onChange: (value: HousingTypeFilter) => void
}

const OPTIONS: Array<{ label: string; value: HousingTypeFilter }> = [
  { label: '아파트', value: 'apartment' },
  { label: '오피스텔', value: 'officetel' },
]

export default function HousingTypeToggle({ value, onChange }: HousingTypeToggleProps) {
  return (
    <fieldset className="toggle-group">
      <legend>주거 유형</legend>
      <div className="toggle-row">
        {OPTIONS.map((option) => (
          <label key={option.value} className="toggle-option">
            <input
              type="radio"
              name="sourceType"
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
