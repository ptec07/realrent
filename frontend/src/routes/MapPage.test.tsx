import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import MapPage from './MapPage'

describe('MapPage', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('shows the selected transaction address and an embedded map search', () => {
    window.history.pushState(
      {},
      '',
      '/map?address=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%EA%B0%9C%ED%8F%AC%EB%8F%99%201-1&buildingName=%EA%B0%9C%ED%8F%AC%EC%9A%B0%EC%84%B12',
    )

    render(<MapPage />)

    expect(screen.getByRole('heading', { name: '지도 보기' })).toBeInTheDocument()
    expect(screen.getByText('개포우성2')).toBeInTheDocument()
    expect(screen.getByText('서울특별시 강남구 개포동 1-1')).toBeInTheDocument()
    expect(screen.getByTitle('서울특별시 강남구 개포동 1-1 지도')).toHaveAttribute(
      'src',
      expect.stringContaining(encodeURIComponent('서울특별시 강남구 개포동 1-1')),
    )
  })

  it('guides the user when address is missing', () => {
    window.history.pushState({}, '', '/map')

    render(<MapPage />)

    expect(screen.getByText('지도에 표시할 주소가 없습니다.')).toBeInTheDocument()
  })
})
