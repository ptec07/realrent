import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '../App'

describe('App', () => {
  it('renders the RealRent landing headline', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /리얼랜트/i })).toBeInTheDocument()
    expect(screen.getByText(/서울·수도권 전월세 실거래가/i)).toBeInTheDocument()
  })
})
