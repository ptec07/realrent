type NullableArea = number | string | null | undefined

export function formatAreaM2(value: NullableArea) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) {
    return '-'
  }

  return `${numericValue.toFixed(2)}㎡`
}
