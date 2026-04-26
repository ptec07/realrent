import { describe, expect, it } from 'vitest'

import { formatManwon, formatSignedManwon } from './formatMoney'
import { formatAreaM2 } from './formatArea'

describe('formatManwon', () => {
  it('formats manwon values into Korean eok/manwon units', () => {
    expect(formatManwon(0)).toBe('0만원')
    expect(formatManwon(70)).toBe('70만원')
    expect(formatManwon(9999)).toBe('9,999만원')
    expect(formatManwon(10000)).toBe('1억')
    expect(formatManwon(12500)).toBe('1억 2,500만원')
    expect(formatManwon(123456)).toBe('12억 3,456만원')
  })

  it('formats nullable and signed manwon values', () => {
    expect(formatManwon(null)).toBe('-')
    expect(formatManwon(undefined)).toBe('-')
    expect(formatSignedManwon(3000)).toBe('+3,000만원')
    expect(formatSignedManwon(-2500)).toBe('-2,500만원')
    expect(formatSignedManwon(0)).toBe('0만원')
    expect(formatSignedManwon(null)).toBe('-')
  })
})

describe('formatAreaM2', () => {
  it('formats area square meters consistently', () => {
    expect(formatAreaM2('59.50')).toBe('59.50㎡')
    expect(formatAreaM2(84)).toBe('84.00㎡')
    expect(formatAreaM2(null)).toBe('-')
    expect(formatAreaM2(undefined)).toBe('-')
  })
})
