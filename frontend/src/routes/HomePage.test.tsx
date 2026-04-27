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

  it('renders hierarchy region selection and basic rental filters without a duplicate region-name input', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: '리얼랜트' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '특별시·광역시·도' })).toBeInTheDocument()
    expect(screen.queryByLabelText('지역명')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '지역명' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '아파트' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '오피스텔' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '전체' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '전세' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '월세' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '매매' })).toBeInTheDocument()
    expect(screen.getByLabelText('보증금 상한')).toBeInTheDocument()
    expect(screen.getByLabelText('월세 상한')).toBeInTheDocument()
  })

  it('does not show a manual region-name input or navigate before selecting 시도·시군구·읍면동', () => {
    render(<HomePage />)

    expect(screen.queryByLabelText('지역명')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '지역명' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '오피스텔' }))
    fireEvent.click(screen.getByRole('radio', { name: '월세' }))
    fireEvent.change(screen.getByLabelText('보증금 상한'), { target: { value: '12000' } })
    fireEvent.change(screen.getByLabelText('월세 상한'), { target: { value: '70' } })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(mockedSearchRegions).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('지역 검색 결과')).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('shows the selected hierarchy place name only in the colored selected box and keeps budget filters', async () => {
    mockedListRegionHierarchy
      .mockResolvedValueOnce({ sidos: ['경기도'], sigungus: [], dongs: [] })
      .mockResolvedValueOnce({ sidos: ['경기도'], sigungus: ['의정부시'], dongs: [] })
      .mockResolvedValueOnce({
        sidos: ['경기도'],
        sigungus: ['의정부시'],
        dongs: [
          {
            fullName: '경기도 의정부시 가능동',
            sido: '경기도',
            sigungu: '의정부시',
            dong: '가능동',
            regionCode5: '41150',
          },
        ],
      })
    render(<HomePage />)

    fireEvent.change(await screen.findByRole('combobox', { name: '특별시·광역시·도' }), { target: { value: '경기도' } })
    fireEvent.change(await screen.findByRole('combobox', { name: '시군구' }), { target: { value: '의정부시' } })
    fireEvent.change(await screen.findByRole('combobox', { name: '읍면동' }), { target: { value: '가능동' } })
    fireEvent.click(screen.getByRole('radio', { name: '매매' }))
    fireEvent.change(screen.getByLabelText('보증금 상한'), { target: { value: '12000' } })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(screen.queryByLabelText('지역명')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '지역명' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '경기도 의정부시 가능동 선택' })).toHaveClass('selected')
    expect(mockedSearchRegions).not.toHaveBeenCalled()
    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toContain('q=%EA%B2%BD%EA%B8%B0%EB%8F%84+%EC%9D%98%EC%A0%95%EB%B6%80%EC%8B%9C+%EA%B0%80%EB%8A%A5%EB%8F%99')
    expect(window.location.search).toContain('regionCode5=41150')
    expect(window.location.search).toContain('dong=%EA%B0%80%EB%8A%A5%EB%8F%99')
    expect(window.location.search).toContain('rentType=sale')
    expect(window.location.search).toContain('depositMax=12000')
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

  it('includes only the selected 읍면동 so results do not include other dongs in the same sigungu', async () => {
    mockedListRegionHierarchy
      .mockResolvedValueOnce({ sidos: ['경기도'], sigungus: [], dongs: [] })
      .mockResolvedValueOnce({ sidos: ['경기도'], sigungus: ['남양주시'], dongs: [] })
      .mockResolvedValueOnce({
        sidos: ['경기도'],
        sigungus: ['남양주시'],
        dongs: [
          {
            fullName: '경기도 남양주시 별내면',
            sido: '경기도',
            sigungu: '남양주시',
            dong: '별내면',
            regionCode5: '41360',
          },
          {
            fullName: '경기도 남양주시 오남읍',
            sido: '경기도',
            sigungu: '남양주시',
            dong: '오남읍',
            regionCode5: '41360',
          },
        ],
      })
    render(<HomePage />)

    fireEvent.change(await screen.findByRole('combobox', { name: '특별시·광역시·도' }), { target: { value: '경기도' } })
    fireEvent.change(await screen.findByRole('combobox', { name: '시군구' }), { target: { value: '남양주시' } })
    fireEvent.change(await screen.findByRole('combobox', { name: '읍면동' }), { target: { value: '별내면' } })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    expect(window.location.pathname).toBe('/results')
    expect(window.location.search).toContain('regionCode5=41360')
    expect(window.location.search).toContain('dong=%EB%B3%84%EB%82%B4%EB%A9%B4')
    expect(window.location.search).not.toContain('%EC%98%A4%EB%82%A8%EC%9D%8D')
  })
})
