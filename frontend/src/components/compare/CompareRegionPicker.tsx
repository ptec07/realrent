import type { FormEvent } from 'react'

interface CompareRegionPickerProps {
  regionA: string
  regionB: string
  onRegionAChange: (value: string) => void
  onRegionBChange: (value: string) => void
  onSubmit: () => void
}

export default function CompareRegionPicker({
  regionA,
  regionB,
  onRegionAChange,
  onRegionBChange,
  onSubmit,
}: CompareRegionPickerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="compare-picker result-panel" aria-label="지역 비교 선택" onSubmit={handleSubmit}>
      <label className="field-group" htmlFor="compare-region-a">
        <span>지역 A 코드</span>
        <input
          id="compare-region-a"
          inputMode="numeric"
          value={regionA}
          placeholder="예: 11200"
          onChange={(event) => onRegionAChange(event.target.value)}
        />
      </label>
      <label className="field-group" htmlFor="compare-region-b">
        <span>지역 B 코드</span>
        <input
          id="compare-region-b"
          inputMode="numeric"
          value={regionB}
          placeholder="예: 11230"
          onChange={(event) => onRegionBChange(event.target.value)}
        />
      </label>
      <button className="primary-action" type="submit">
        비교하기
      </button>
    </form>
  )
}
