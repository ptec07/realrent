import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import HomePage from './HomePage'

vi.mock('../api/regions', () => ({
  searchRegions: vi.fn(() => new Promise(() => {})),
}))

describe('HomePage', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
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
})
