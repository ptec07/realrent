type NullableNumber = number | null | undefined

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR')
}

export function formatManwon(value: NullableNumber) {
  if (value === null || value === undefined) {
    return '-'
  }

  const eok = Math.trunc(value / 10000)
  const manwon = Math.abs(value % 10000)

  if (eok === 0) {
    return `${formatNumber(value)}만원`
  }

  if (manwon === 0) {
    return `${formatNumber(eok)}억`
  }

  return `${formatNumber(eok)}억 ${formatNumber(manwon)}만원`
}

export function formatSignedManwon(value: NullableNumber) {
  if (value === null || value === undefined) {
    return '-'
  }

  const sign = value > 0 ? '+' : ''
  return `${sign}${formatManwon(value)}`
}
