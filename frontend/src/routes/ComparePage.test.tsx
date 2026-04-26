import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCompare } from '../api/compare'
import ComparePage from './ComparePage'

vi.mock('../api/compare', () => ({
  getCompare: vi.fn(),
}))

const mockedGetCompare = vi.mocked(getCompare)

describe('ComparePage', () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      '',
      '/compare?regionA=11200&regionB=11230&sourceType=officetel&rentType=monthly',
    )
    mockedGetCompare.mockResolvedValue({
      regionA: {
        regionCode5: '11200',
        transactionCount: 7,
        avgDepositManwon: 12000,
        avgMonthlyRentManwon: 70,
        avgAreaM2: '59.50',
        latestMonth: '2026-03',
        sampleWarning: null,
      },
      regionB: {
        regionCode5: '11230',
        transactionCount: 5,
        avgDepositManwon: 15000,
        avgMonthlyRentManwon: 90,
        avgAreaM2: '62.10',
        latestMonth: '2026-03',
        sampleWarning: null,
      },
      diff: {
        depositManwon: 3000,
        monthlyRentManwon: 20,
      },
      insight: '11230 지역은 11200 지역보다 평균 보증금이 3,000만원 높고 월세가 20만원 높습니다.',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('loads compare data from URL filters and displays both regions, diff, and insight', async () => {
    render(<ComparePage />)

    expect(screen.getByRole('heading', { name: '지역 비교' })).toBeInTheDocument()
    expect(screen.getByLabelText('지역 A 코드')).toHaveValue('11200')
    expect(screen.getByLabelText('지역 B 코드')).toHaveValue('11230')

    expect(await screen.findByText('지역 A · 11200')).toBeInTheDocument()
    expect(screen.getByText('거래 7건 · 평균 보증금 1억 2,000만원 · 평균 월세 70만원')).toBeInTheDocument()
    expect(screen.getByText('지역 B · 11230')).toBeInTheDocument()
    expect(screen.getByText('거래 5건 · 평균 보증금 1억 5,000만원 · 평균 월세 90만원')).toBeInTheDocument()
    expect(screen.getByText('보증금 차이 +3,000만원')).toBeInTheDocument()
    expect(screen.getByText('월세 차이 +20만원')).toBeInTheDocument()
    expect(
      screen.getByText('11230 지역은 11200 지역보다 평균 보증금이 3,000만원 높고 월세가 20만원 높습니다.'),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedGetCompare).toHaveBeenCalledWith({
        regionA: '11200',
        regionB: '11230',
        sourceType: 'officetel',
        rentType: 'monthly',
        months: 12,
      })
    })
  })

  it('updates URL and reloads comparison when user submits region codes', async () => {
    render(<ComparePage />)

    fireEvent.change(screen.getByLabelText('지역 A 코드'), { target: { value: '11110' } })
    fireEvent.change(screen.getByLabelText('지역 B 코드'), { target: { value: '11680' } })
    fireEvent.click(screen.getByRole('button', { name: '비교하기' }))

    expect(window.location.pathname).toBe('/compare')
    expect(window.location.search).toBe('?regionA=11110&regionB=11680&sourceType=officetel&rentType=monthly')

    await waitFor(() => {
      expect(mockedGetCompare).toHaveBeenLastCalledWith({
        regionA: '11110',
        regionB: '11680',
        sourceType: 'officetel',
        rentType: 'monthly',
        months: 12,
      })
    })
  })

  it('shows an empty state when both region codes are not selected', () => {
    window.history.pushState({}, '', '/compare')

    render(<ComparePage />)

    expect(screen.getByText('비교할 두 지역 코드를 입력해 주세요.')).toBeInTheDocument()
    expect(mockedGetCompare).not.toHaveBeenCalled()
  })
})
