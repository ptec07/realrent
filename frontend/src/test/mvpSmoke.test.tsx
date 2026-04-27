import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCompare } from '../api/compare'
import { listRegionHierarchy, searchRegions } from '../api/regions'
import { getSummary } from '../api/summaries'
import { getTransactions } from '../api/transactions'
import { getTrends } from '../api/trends'
import App from '../App'

vi.mock('../api/regions', () => ({
  searchRegions: vi.fn(),
  listRegionHierarchy: vi.fn(),
}))
vi.mock('../api/summaries', () => ({
  getSummary: vi.fn(),
}))
vi.mock('../api/trends', () => ({
  getTrends: vi.fn(),
}))
vi.mock('../api/transactions', () => ({
  getTransactions: vi.fn(),
}))
vi.mock('../api/compare', () => ({
  getCompare: vi.fn(),
}))

const mockedSearchRegions = vi.mocked(searchRegions)
const mockedListRegionHierarchy = vi.mocked(listRegionHierarchy)
const mockedGetSummary = vi.mocked(getSummary)
const mockedGetTrends = vi.mocked(getTrends)
const mockedGetTransactions = vi.mocked(getTransactions)
const mockedGetCompare = vi.mocked(getCompare)

describe('MVP smoke flow', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    mockedListRegionHierarchy.mockResolvedValue({ sidos: [], sigungus: [], dongs: [] })
    mockedSearchRegions.mockResolvedValue({
      items: [
        {
          fullName: '서울특별시 성동구 성수동',
          sido: '서울특별시',
          sigungu: '성동구',
          dong: '성수동',
          regionCode5: '11200',
        },
      ],
    })
    mockedGetSummary.mockResolvedValue({
      regionCode5: '11200',
      sourceType: 'apartment',
      rentType: 'monthly',
      months: 12,
      transactionCount: 7,
      avgDepositManwon: 12000,
      avgMonthlyRentManwon: 70,
      avgAreaM2: '59.50',
      latestMonth: '2026-03',
      sampleWarning: null,
    })
    mockedGetTrends.mockResolvedValue({
      regionCode5: '11200',
      sourceType: 'apartment',
      rentType: 'monthly',
      months: 12,
      points: [
        {
          month: '2026-03',
          transactionCount: 4,
          avgDepositManwon: 12000,
          avgMonthlyRentManwon: 70,
          avgAreaM2: '59.50',
        },
      ],
    })
    mockedGetTransactions.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 1,
      items: [
        {
          id: 1,
          sourceType: 'apartment',
          rentType: 'monthly',
          regionSido: '서울특별시',
          regionSigungu: '성동구',
          regionDong: '성수동',
          regionCode5: '11200',
          buildingName: '성수리버뷰',
          addressJibun: '1-1',
          areaM2: '59.50',
          floor: 12,
          builtYear: 2018,
          contractDate: '2026-03-15',
          contractYearMonth: '2026-03',
          depositAmountManwon: 12000,
          monthlyRentManwon: 70,
        },
      ],
    })
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
      insight: '왕십리동은 성수동보다 평균 보증금과 월세가 높습니다.',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('searches a region, opens transaction detail, and compares with another region', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('지역명'), { target: { value: '성수' } })
    fireEvent.click(await screen.findByRole('button', { name: '서울특별시 성동구 성수동 선택' }))
    fireEvent.click(screen.getByRole('radio', { name: '월세' }))
    fireEvent.change(screen.getByLabelText('보증금 상한'), { target: { value: '12000' } })
    fireEvent.change(screen.getByLabelText('월세 상한'), { target: { value: '70' } })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toContain('regionCode5=11200')

    expect(await screen.findByText('성수리버뷰')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '성수리버뷰 거래 상세 열기' }))
    expect(screen.getByText('지번 1-1 · 준공 2018년')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '지역 비교하기' }))
    expect(window.location.pathname).toBe('/compare')
    fireEvent.change(await screen.findByLabelText('지역 B 코드'), { target: { value: '11230' } })
    fireEvent.click(screen.getByRole('button', { name: '비교하기' }))

    expect(await screen.findByText('왕십리동은 성수동보다 평균 보증금과 월세가 높습니다.')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockedGetCompare).toHaveBeenLastCalledWith({
        regionA: '11200',
        regionB: '11230',
        sourceType: 'apartment',
        rentType: 'monthly',
        months: 12,
      })
    })
  })
})
