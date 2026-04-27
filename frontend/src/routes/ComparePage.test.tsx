import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCompare } from '../api/compare'
import { listRegionHierarchy } from '../api/regions'
import ComparePage from './ComparePage'

vi.mock('../api/compare', () => ({
  getCompare: vi.fn(),
}))

vi.mock('../api/regions', () => ({
  listRegionHierarchy: vi.fn(),
}))

const mockedGetCompare = vi.mocked(getCompare)
const mockedListRegionHierarchy = vi.mocked(listRegionHierarchy)

describe('ComparePage', () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      '',
      '/compare?regionA=11200&regionB=11230&sourceType=officetel&rentType=monthly',
    )
    mockedListRegionHierarchy.mockImplementation((params = {}) => {
      if (!params.sido) {
        return Promise.resolve({ sidos: ['서울특별시'], sigungus: [], dongs: [] })
      }
      if (!params.sigungu) {
        return Promise.resolve({ sidos: ['서울특별시'], sigungus: ['성동구', '광진구'], dongs: [] })
      }
      if (params.sigungu === '광진구') {
        return Promise.resolve({
          sidos: ['서울특별시'],
          sigungus: ['성동구', '광진구'],
          dongs: [{ fullName: '서울특별시 광진구 자양동', sido: '서울특별시', sigungu: '광진구', dong: '자양동', regionCode5: '11230' }],
        })
      }
      return Promise.resolve({
        sidos: ['서울특별시'],
        sigungus: ['성동구', '광진구'],
        dongs: [{ fullName: '서울특별시 성동구 성수동', sido: '서울특별시', sigungu: '성동구', dong: '성수동', regionCode5: '11200' }],
      })
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

    expect((await screen.findAllByText('지역 A · 11200')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('거래 7건 · 평균 보증금 1억 2,000만원 · 평균 월세 70만원').length).toBeGreaterThan(0)
    expect(screen.getAllByText('지역 B · 11230').length).toBeGreaterThan(0)
    expect(screen.getAllByText('거래 5건 · 평균 보증금 1억 5,000만원 · 평균 월세 90만원').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/보증금 차이/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/월세 차이/).length).toBeGreaterThan(0)
    expect(
      screen.getByText('11230 지역은 11200 지역보다 평균 보증금이 3,000만원 높고 월세가 20만원 높습니다.'),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedGetCompare).toHaveBeenCalledWith(expect.objectContaining({
        regionA: '11200',
        regionB: '11230',
        sourceType: 'apartment',
        rentType: 'sale',
        months: 3,
      }))
    })
  })

  it('updates URL and reloads comparison when user submits region codes', async () => {
    render(<ComparePage />)

    fireEvent.change(screen.getByLabelText('지역 A 코드'), { target: { value: '11110' } })
    fireEvent.change(screen.getByLabelText('지역 B 코드'), { target: { value: '11680' } })
    fireEvent.click(screen.getByRole('button', { name: '비교하기' }))

    expect(window.location.pathname).toBe('/compare')
    expect(window.location.search).toBe('?regionA=11110&regionB=11680&months=3')

    await waitFor(() => {
      expect(mockedGetCompare).toHaveBeenCalledWith(expect.objectContaining({
        regionA: '11110',
        regionB: '11680',
        sourceType: 'officetel',
        rentType: 'all',
        months: 3,
      }))
    })
  })

  it('shows an empty state when both region codes are not selected', () => {
    window.history.pushState({}, '', '/compare')

    render(<ComparePage />)

    expect(screen.getByText('비교할 두 지역 코드를 입력해 주세요.')).toBeInTheDocument()
    expect(mockedGetCompare).not.toHaveBeenCalled()
  })

  it('uses hierarchy selectors and a default 3 month period to compare the current dong against the selected dong across apartment and officetel prices', async () => {
    window.history.pushState({}, '', '/compare?regionA=11200&dongA=성수동&regionB=11230&dongB=자양동')
    render(<ComparePage />)

    expect(screen.getByLabelText('비교 기간')).toHaveValue('3')
    expect(await screen.findByLabelText('특별시·광역시·도')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedGetCompare).toHaveBeenCalledWith(expect.objectContaining({ regionA: '11200', dongA: '성수동', regionB: '11230', dongB: '자양동', sourceType: 'apartment', rentType: 'sale', months: 3 }))
      expect(mockedGetCompare).toHaveBeenCalledWith(expect.objectContaining({ regionA: '11200', dongA: '성수동', regionB: '11230', dongB: '자양동', sourceType: 'apartment', rentType: 'all', months: 3 }))
      expect(mockedGetCompare).toHaveBeenCalledWith(expect.objectContaining({ regionA: '11200', dongA: '성수동', regionB: '11230', dongB: '자양동', sourceType: 'officetel', rentType: 'sale', months: 3 }))
      expect(mockedGetCompare).toHaveBeenCalledWith(expect.objectContaining({ regionA: '11200', dongA: '성수동', regionB: '11230', dongB: '자양동', sourceType: 'officetel', rentType: 'all', months: 3 }))
    })

    fireEvent.change(screen.getByLabelText('비교 기간'), { target: { value: '6' } })
    await waitFor(() => {
      expect(mockedGetCompare).toHaveBeenCalledWith(expect.objectContaining({ months: 6 }))
    })

    fireEvent.change(screen.getByLabelText('특별시·광역시·도'), { target: { value: '서울특별시' } })
    fireEvent.change(await screen.findByLabelText('시군구'), { target: { value: '광진구' } })
    fireEvent.change(await screen.findByLabelText('읍면동'), { target: { value: '자양동' } })
    fireEvent.click(screen.getByRole('button', { name: '비교하기' }))

    expect(window.location.search).toContain('dongB=%EC%9E%90%EC%96%91%EB%8F%99')
  })

  it('links to the transaction price trend page beside compare results', async () => {
    window.history.pushState({}, '', '/compare?regionA=11200&dongA=성수동&regionB=11230&dongB=자양동')
    render(<ComparePage />)

    const link = await screen.findByRole('link', { name: '실거래가변동화면' })
    expect(link).toHaveAttribute('href', expect.stringContaining('/price-trends?'))
    expect(link).toHaveAttribute('href', expect.stringContaining('months=3'))
    expect(link).toHaveAttribute('href', expect.stringContaining('dongA='))
    expect(link).toHaveAttribute('href', expect.stringContaining('dongB='))
  })

})
