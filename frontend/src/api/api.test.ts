import { afterEach, describe, expect, it, vi } from 'vitest'

import { getCompare } from './compare'
import { searchRegions } from './regions'
import { getSummary } from './summaries'
import { getTransactions } from './transactions'
import { getTrends } from './trends'

function mockJsonResponse(payload: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('frontend API wrappers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('searchRegions fetches /api/regions with q and returns typed items', async () => {
    const fetchMock = vi.fn(() =>
      mockJsonResponse({
        items: [
          {
            fullName: '서울특별시 성동구 성수동',
            sido: '서울특별시',
            sigungu: '성동구',
            dong: '성수동',
            regionCode5: '11200',
          },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchRegions('성수동')

    expect(fetchMock).toHaveBeenCalledWith('/api/regions?q=%EC%84%B1%EC%88%98%EB%8F%99')
    expect(result.items[0].regionCode5).toBe('11200')
  })

  it('getTransactions serializes optional filters and skips empty values', async () => {
    const fetchMock = vi.fn(() => mockJsonResponse({ items: [], page: 2, pageSize: 20, total: 0 }))
    vi.stubGlobal('fetch', fetchMock)

    await getTransactions({
      regionCode5: '11200',
      sourceType: 'apartment',
      rentType: 'monthly',
      depositMax: 12000,
      monthlyRentMax: undefined,
      sort: 'latest',
      page: 2,
      pageSize: 20,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/transactions?regionCode5=11200&sourceType=apartment&rentType=monthly&depositMax=12000&sort=latest&page=2&pageSize=20',
    )
  })

  it('getSummary and getTrends call their matching endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        mockJsonResponse({
          regionCode5: '11200',
          sourceType: 'apartment',
          rentType: 'monthly',
          months: 12,
          transactionCount: 5,
          avgDepositManwon: 10000,
          avgMonthlyRentManwon: 70,
          avgAreaM2: '40.00',
          latestMonth: '2025-01',
          sampleWarning: null,
        }),
      )
      .mockImplementationOnce(() =>
        mockJsonResponse({
          regionCode5: '11200',
          sourceType: 'apartment',
          rentType: 'monthly',
          months: 6,
          points: [],
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await getSummary({ regionCode5: '11200', sourceType: 'apartment', rentType: 'monthly', months: 12 })
    await getTrends({ regionCode5: '11200', sourceType: 'apartment', rentType: 'monthly', months: 6 })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/summary?regionCode5=11200&sourceType=apartment&rentType=monthly&months=12',
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/trends?regionCode5=11200&sourceType=apartment&rentType=monthly&months=6',
    )
  })

  it('getCompare fetches /api/compare for two regions', async () => {
    const fetchMock = vi.fn(() =>
      mockJsonResponse({
        regionA: { regionCode5: '11200', transactionCount: 1 },
        regionB: { regionCode5: '11230', transactionCount: 1 },
        diff: { depositManwon: -1000, monthlyRentManwon: -10 },
        insight: 'B가 A보다 평균 보증금과 월세가 낮습니다.',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getCompare({ regionA: '11200', regionB: '11230', sourceType: 'officetel', months: 3 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/compare?regionA=11200&regionB=11230&sourceType=officetel&months=3',
    )
    expect(result.insight).toContain('B가 A보다')
  })

  it('throws a useful error when the API returns a non-ok status', async () => {
    const fetchMock = vi.fn(() => mockJsonResponse({ detail: 'bad request' }, 400))
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchRegions('')).rejects.toThrow('RealRent API request failed: 400')
  })
})
