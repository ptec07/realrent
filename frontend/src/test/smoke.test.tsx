import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from '../App'

vi.mock('../api/regions', () => ({
  searchRegions: vi.fn(() => new Promise(() => {})),
  listRegionHierarchy: vi.fn(() => new Promise(() => {})),
}))

describe('App', () => {
  it('renders the RealRent landing headline', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /리얼랜트/i })).toBeInTheDocument()
    expect(screen.getByText(/서울·수도권 전월세 실거래가/i)).toBeInTheDocument()
  })
})
