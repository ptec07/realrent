import type { FormEvent } from 'react'

interface CompareRegionPickerProps {
  onSubmit: () => void
}

export default function CompareRegionPicker({ onSubmit }: CompareRegionPickerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="compare-picker result-panel" aria-label="지역 비교 선택" onSubmit={handleSubmit}>
      <button className="primary-action" type="submit">
        비교하기
      </button>
    </form>
  )
}
