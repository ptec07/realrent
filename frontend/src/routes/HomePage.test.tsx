import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { listRegionHierarchy, searchRegions } from '../api/regions'
import HomePage from './HomePage'

vi.mock('../api/regions', () => ({
  searchRegions: vi.fn(() => new Promise(() => {})),
  listRegionHierarchy: vi.fn(() => new Promise(() => {})),
}))

const mockedSearchRegions = vi.mocked(searchRegions)
const mockedListRegionHierarchy = vi.mocked(listRegionHierarchy)

describe('HomePage', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
    mockedListRegionHierarchy.mockImplementation(() => new Promise(() => {}))
  })

  it('renders region search and basic rental filters', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: '리얼랜트' })).toBeInTheDocument()
    expect(screen.getByLabelText('지역명')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '아파트' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '오피스텔' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '전체' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '전세' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '월세' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '매매' })).toBeInTheDocument()
    expect(screen.getByLabelText('보증금 상한')).toBeInTheDocument()
    expect(screen.getByLabelText('월세 상한')).toBeInTheDocument()
  })

  it('navigates to results with query params on submit', () => {
    render(<HomePage />)

    fireEvent.change(screen.getByLabelText('지역명'), { target: { value: '성수동' } })
    fireEvent.click(screen.getByRole('radio', { name: '오피스텔' }))
    fireEvent.click(screen.getByRole('radio', { name: '월세' }))
    fireEvent.change(screen.getByLabelText('보증금 상한'), { target: { value: '12000' } })
    fireEvent.change(screen.getByLabelText('월세 상한'), { target: { value: '70' } })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toBe(
      '?q=%EC%84%B1%EC%88%98%EB%8F%99&sourceType=officetel&rentType=monthly&depositMax=12000&monthlyRentMax=70',
    )
  })

  it('omits empty budget values from navigation params', () => {
    render(<HomePage />)

    fireEvent.change(screen.getByLabelText('지역명'), { target: { value: '강남구' } })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toBe('?q=%EA%B0%95%EB%82%A8%EA%B5%AC&sourceType=apartment&rentType=all')
  })

  it('navigates to results with sale rent type when selected', () => {
    render(<HomePage />)

    fireEvent.change(screen.getByLabelText('지역명'), { target: { value: '강남구' } })
    fireEvent.click(screen.getByRole('radio', { name: '매매' }))
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toBe('?q=%EA%B0%95%EB%82%A8%EA%B5%AC&sourceType=apartment&rentType=sale')
  })

  it('uses the first matching region when the user submits without clicking a suggestion', async () => {
    mockedSearchRegions.mockResolvedValueOnce({
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
    render(<HomePage />)

    fireEvent.change(screen.getByLabelText('지역명'), { target: { value: '성수' } })
    await screen.findByRole('button', { name: '서울특별시 성동구 성수동 선택' })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toContain('regionCode5=11200')
    expect(window.location.search).toContain('dong=%EC%84%B1%EC%88%98%EB%8F%99')
  })

  it('loads 시도, 시군구, 읍면동 listboxes hierarchically and searches the selected dong', async () => {
    mockedListRegionHierarchy
      .mockResolvedValueOnce({ sidos: ['경기도', '서울특별시'], sigungus: [], dongs: [] })
      .mockResolvedValueOnce({ sidos: ['경기도', '서울특별시'], sigungus: ['남양주시', '의정부시'], dongs: [] })
      .mockResolvedValueOnce({
        sidos: ['경기도', '서울특별시'],
        sigungus: ['남양주시', '의정부시'],
        dongs: [
          {
            fullName: '경기도 의정부시 가능동',
            sido: '경기도',
            sigungu: '의정부시',
            dong: '가능동',
            regionCode5: '41150',
          },
          {
            fullName: '경기도 의정부시 의정부동',
            sido: '경기도',
            sigungu: '의정부시',
            dong: '의정부동',
            regionCode5: '41150',
          },
        ],
      })
    render(<HomePage />)

    expect(await screen.findByRole('combobox', { name: '특별시·광역시·도' })).toHaveTextContent('경기도')
    fireEvent.change(screen.getByRole('combobox', { name: '특별시·광역시·도' }), { target: { value: '경기도' } })
    expect(await screen.findByRole('combobox', { name: '시군구' })).toHaveTextContent('남양주시')
    expect(screen.getByRole('combobox', { name: '시군구' })).toHaveTextContent('의정부시')

    fireEvent.change(screen.getByRole('combobox', { name: '시군구' }), { target: { value: '의정부시' } })
    expect(await screen.findByRole('combobox', { name: '읍면동' })).toHaveTextContent('가능동')
    expect(screen.getByRole('combobox', { name: '읍면동' })).toHaveTextContent('의정부동')

    fireEvent.change(screen.getByRole('combobox', { name: '읍면동' }), { target: { value: '가능동' } })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    await waitFor(() => expect(window.location.pathname).toBe('/results'))
    expect(window.location.search).toContain('q=%EA%B2%BD%EA%B8%B0%EB%8F%84+%EC%9D%98%EC%A0%95%EB%B6%80%EC%8B%9C+%EA%B0%80%EB%8A%A5%EB%8F%99')
    expect(window.location.search).toContain('regionCode5=41150')
    expect(window.location.search).toContain('dong=%EA%B0%80%EB%8A%A5%EB%8F%99')
    expect(mockedListRegionHierarchy).toHaveBeenCalledWith({ sido: '경기도' })
    expect(mockedListRegionHierarchy).toHaveBeenCalledWith({ sido: '경기도', sigungu: '의정부시' })
  })

  it('includes the selected 읍면동 so results do not include other dongs in the same sigungu', async () => {
    mockedSearchRegions.mockResolvedValueOnce({
      items: [
        {
          fullName: '경기도 남양주시 별내면',
          sido: '경기도',
          sigungu: '남양주시',
          dong: '별내면',
          regionCode5: '41360',
        },
      ],
    })
    render(<HomePage />)

    fireEvent.change(screen.getByLabelText('지역명'), { target: { value: '별내면' } })
    fireEvent.click(await screen.findByRole('button', { name: '경기도 남양주시 별내면 선택' }))
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toContain('regionCode5=41360')
    expect(window.location.search).toContain('dong=%EB%B3%84%EB%82%B4%EB%A9%B4')
  })
})
