import type { RegionItem } from '../../api/regions'

interface RegionSearchBoxProps {
  value: string
  onChange: (value: string) => void
  suggestions?: RegionItem[]
  selectedRegionCode5?: string
  onSelect?: (region: RegionItem) => void
  readOnly?: boolean
  showInput?: boolean
}

export default function RegionSearchBox({
  value,
  onChange,
  suggestions = [],
  selectedRegionCode5,
  onSelect,
  readOnly = false,
  showInput = true,
}: RegionSearchBoxProps) {
  return (
    <div className="region-search-box">
      {showInput ? (
        <label className="field-group" htmlFor="region-query">
          <span>지역명</span>
          <input
            id="region-query"
            name="region"
            value={value}
            placeholder="시도·시군구·읍면동을 선택하면 표시됩니다"
            readOnly={readOnly}
            onChange={(event) => {
              if (!readOnly) {
                onChange(event.target.value)
              }
            }}
          />
        </label>
      ) : null}
      {suggestions.length > 0 ? (
        <div className="region-suggestions" aria-label="지역 검색 결과">
          {suggestions.map((region) => (
            <button
              aria-label={`${region.fullName} 선택`}
              className={region.regionCode5 === selectedRegionCode5 ? 'region-suggestion selected' : 'region-suggestion'}
              key={`${region.regionCode5}-${region.fullName}`}
              type="button"
              onClick={() => onSelect?.(region)}
            >
              <span>{region.fullName}</span>
              <span className="sr-only"> 선택</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
