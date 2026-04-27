import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getTrends } from '../api/trends'
import PriceTrendsPage from './PriceTrendsPage'

vi.mock('../api/trends', () => ({
  getTrends: vi.fn(),
}))

const mockedGetTrends = vi.mocked(getTrends)

describe('PriceTrendsPage', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/price-trends?regionA=11200&dongA=성수동&regionB=11230&dongB=자양동&months=3')
    mockedGetTrends.mockResolvedValue({
      regionCode5: '11200',
      sourceType: 'apartment',
      rentType: 'sale',
      months: 3,
      points: [
        { month: '2026-01', transactionCount: 2, avgDepositManwon: 10000, avgMonthlyRentManwon: 0, avgAreaM2: '60.00' },
        { month: '2026-02', transactionCount: 2, avgDepositManwon: 12000, avgMonthlyRentManwon: 0, avgAreaM2: '60.00' },
      ],
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('shows a default 3 month period picker and line chart for selected and current dongs', async () => {
    render(<PriceTrendsPage />)

    expect(screen.getByRole('heading', { name: '실거래가 변동' })).toBeInTheDocument()
    expect(screen.getByLabelText('비교 기간')).toHaveValue('3')

    await waitFor(() => {
      expect(mockedGetTrends).toHaveBeenCalledWith(expect.objectContaining({ regionCode5: '11200', dong: '성수동', sourceType: 'apartment', rentType: 'sale', months: 3 }))
      expect(mockedGetTrends).toHaveBeenCalledWith(expect.objectContaining({ regionCode5: '11230', dong: '자양동', sourceType: 'officetel', rentType: 'all', months: 3 }))
    })

    expect((await screen.findAllByLabelText('가격추이 꺾은선 그래프')).length).toBeGreaterThan(0)
    expect(screen.getByText('아파트 평균매매가')).toBeInTheDocument()
    expect(screen.getByText('오피스텔 전월세')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('비교 기간'), { target: { value: '6' } })
    await waitFor(() => {
      expect(mockedGetTrends).toHaveBeenCalledWith(expect.objectContaining({ months: 6 }))
    })
  })
})
