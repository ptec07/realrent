import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSummary } from '../api/summaries'
import { getTransactions } from '../api/transactions'
import { getTrends } from '../api/trends'
import SearchResultsPage from './SearchResultsPage'

vi.mock('../api/summaries', () => ({
  getSummary: vi.fn(),
}))
vi.mock('../api/trends', () => ({
  getTrends: vi.fn(),
}))
vi.mock('../api/transactions', () => ({
  getTransactions: vi.fn(),
}))

const mockedGetSummary = vi.mocked(getSummary)
const mockedGetTrends = vi.mocked(getTrends)
const mockedGetTransactions = vi.mocked(getTransactions)

describe('SearchResultsPage', () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      '',
      '/results?regionCode5=11200&q=%EC%84%B1%EC%88%98%EB%8F%99&sourceType=apartment&rentType=monthly&depositMax=12000&monthlyRentMax=70',
    )
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
          month: '2026-02',
          transactionCount: 3,
          avgDepositManwon: 11000,
          avgMonthlyRentManwon: 65,
          avgAreaM2: '58.00',
        },
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
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('loads result data from URL filters and displays summary, trend, and transactions', async () => {
    render(<SearchResultsPage />)

    expect(screen.getByRole('heading', { name: '검색 결과' })).toBeInTheDocument()
    expect(screen.getByText('성수동의 전월세 실거래 요약입니다.')).toBeInTheDocument()

    expect(await screen.findByText('거래 7건')).toBeInTheDocument()
    expect(screen.getByText('평균 보증금 1억 2,000만원')).toBeInTheDocument()
    expect(screen.getByText('평균 월세 70만원')).toBeInTheDocument()
    expect(screen.getByText('2026-03 기준')).toBeInTheDocument()

    expect(screen.getByText('월별 추이')).toBeInTheDocument()
    expect(screen.getByText('2026-02: 보증금 1억 1,000만원 · 월세 65만원 · 3건')).toBeInTheDocument()
    expect(screen.getByText('2026-03: 보증금 1억 2,000만원 · 월세 70만원 · 4건')).toBeInTheDocument()

    expect(screen.getByText('성수리버뷰')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '서울특별시 성동구 성수동 1-1' })).toBeInTheDocument()
    expect(screen.getByText('보증금 1억 2,000만원 / 월세 70만원')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedGetSummary).toHaveBeenCalledWith({
        regionCode5: '11200',
        dong: undefined,
        sourceType: 'apartment',
        rentType: 'monthly',
        months: 12,
      })
      expect(mockedGetTrends).toHaveBeenCalledWith({
        regionCode5: '11200',
        dong: undefined,
        sourceType: 'apartment',
        rentType: 'monthly',
        months: 12,
      })
      expect(mockedGetTransactions).toHaveBeenCalledWith({
        regionCode5: '11200',
        dong: undefined,
        sourceType: 'apartment',
        rentType: 'monthly',
        depositMax: 12000,
        monthlyRentMax: 70,
        page: 1,
        pageSize: 100,
        sort: 'latest',
      })
    })
  })

  it('links back to the main screen from search results', async () => {
    render(<SearchResultsPage />)
    await screen.findByText('거래 7건')

    const mainLink = screen.getByRole('link', { name: '메인화면' })
    expect(mainLink).toHaveAttribute('href', '/')

    fireEvent.click(mainLink)

    expect(window.location.pathname).toBe('/')
  })

  it('passes the selected dong to every results API request', async () => {
    window.history.pushState(
      {},
      '',
      '/results?regionCode5=41360&q=%EB%B3%84%EB%82%B4%EB%A9%B4&dong=%EB%B3%84%EB%82%B4%EB%A9%B4&sourceType=apartment&rentType=sale',
    )

    render(<SearchResultsPage />)

    await waitFor(() => {
      expect(mockedGetSummary).toHaveBeenCalledWith(expect.objectContaining({ regionCode5: '41360', dong: '별내면' }))
      expect(mockedGetTrends).toHaveBeenCalledWith(expect.objectContaining({ regionCode5: '41360', dong: '별내면' }))
      expect(mockedGetTransactions).toHaveBeenCalledWith(expect.objectContaining({ regionCode5: '41360', dong: '별내면' }))
    })
  })

  it('centers the focused transaction after returning from the map page', async () => {
    const scrollIntoView = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView
    window.history.pushState(
      {},
      '',
      '/results?regionCode5=11200&q=%EC%84%B1%EC%88%98%EB%8F%99&sourceType=apartment&rentType=monthly&focusTransactionId=1',
    )

    render(<SearchResultsPage />)

    const focusedCard = await screen.findByTestId('transaction-card-1')
    expect(focusedCard).toHaveAttribute('data-focused', 'true')
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
    })
  })

  it('loads every transaction page when the API total is larger than one page', async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      pageSize: 100,
      total: 101,
      items: Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        sourceType: 'apartment',
        rentType: 'monthly',
        regionSido: '서울특별시',
        regionSigungu: '성동구',
        regionDong: '성수동',
        regionCode5: '11200',
        buildingName: `성수리버뷰${index + 1}`,
        addressJibun: `${index + 1}`,
        areaM2: '59.50',
        floor: 12,
        builtYear: 2018,
        contractDate: '2026-03-15',
        contractYearMonth: '2026-03',
        depositAmountManwon: 12000,
        monthlyRentManwon: 70,
      })),
    })
    mockedGetTransactions.mockResolvedValueOnce({
      page: 2,
      pageSize: 100,
      total: 101,
      items: [
        {
          id: 101,
          sourceType: 'apartment',
          rentType: 'monthly',
          regionSido: '서울특별시',
          regionSigungu: '성동구',
          regionDong: '성수동',
          regionCode5: '11200',
          buildingName: '성수리버뷰101',
          addressJibun: '101',
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

    render(<SearchResultsPage />)

    expect(await screen.findByText('총 101건')).toBeInTheDocument()
    expect(screen.getByText('성수리버뷰1')).toBeInTheDocument()
    expect(screen.getByText('성수리버뷰101')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedGetTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 100, sort: 'latest' }),
      )
      expect(mockedGetTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 100, sort: 'latest' }),
      )
    })
  })

  it('labels sale result summaries and trends as sale prices', async () => {
    window.history.pushState(
      {},
      '',
      '/results?regionCode5=11680&q=%EA%B0%95%EB%82%A8%EA%B5%AC&sourceType=apartment&rentType=sale',
    )
    mockedGetSummary.mockResolvedValueOnce({
      regionCode5: '11680',
      sourceType: 'apartment',
      rentType: 'sale',
      months: 12,
      transactionCount: 5,
      avgDepositManwon: 215000,
      avgMonthlyRentManwon: 0,
      avgAreaM2: '84.81',
      latestMonth: '2025-01',
      sampleWarning: null,
    })
    mockedGetTrends.mockResolvedValueOnce({
      regionCode5: '11680',
      sourceType: 'apartment',
      rentType: 'sale',
      months: 12,
      points: [
        {
          month: '2025-01',
          transactionCount: 5,
          avgDepositManwon: 215000,
          avgMonthlyRentManwon: 0,
          avgAreaM2: '84.81',
        },
      ],
    })
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      pageSize: 20,
      total: 1,
      items: [
        {
          id: 2,
          sourceType: 'apartment',
          rentType: 'sale',
          regionSido: '서울특별시',
          regionSigungu: '강남구',
          regionDong: '개포동',
          regionCode5: '11680',
          buildingName: '매매아파트',
          addressJibun: '1-1',
          areaM2: '84.81',
          floor: 7,
          builtYear: 1988,
          contractDate: '2025-01-11',
          contractYearMonth: '2025-01',
          depositAmountManwon: 215000,
          monthlyRentManwon: 0,
        },
      ],
    })

    render(<SearchResultsPage />)

    expect(screen.getByText('강남구의 매매 실거래 요약입니다.')).toBeInTheDocument()
    expect(await screen.findByText('평균 매매가 21억 5,000만원')).toBeInTheDocument()
    expect(screen.queryByText(/평균 보증금/)).not.toBeInTheDocument()
    expect(screen.getByText('2025-01: 매매가 21억 5,000만원 · 5건')).toBeInTheDocument()
  })

  it('shows an empty state when region code is missing', () => {
    window.history.pushState({}, '', '/results?q=%EC%84%B1%EC%88%98%EB%8F%99')

    render(<SearchResultsPage />)

    expect(screen.getByText('지역 코드가 없어 결과를 불러올 수 없습니다.')).toBeInTheDocument()
    expect(mockedGetSummary).not.toHaveBeenCalled()
    expect(mockedGetTrends).not.toHaveBeenCalled()
    expect(mockedGetTransactions).not.toHaveBeenCalled()
  })
})
