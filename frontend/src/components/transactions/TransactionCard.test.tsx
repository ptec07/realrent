import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { TransactionItem } from '../../api/transactions'
import TransactionCard from './TransactionCard'

const transaction: TransactionItem = {
  id: 1,
  sourceType: 'apartment',
  rentType: 'jeonse',
  regionSido: '서울특별시',
  regionSigungu: '강남구',
  regionDong: '개포동',
  regionCode5: '11680',
  buildingName: '개포우성2',
  addressJibun: '1-1',
  areaM2: '84.92',
  floor: 7,
  builtYear: 1988,
  contractDate: '2025-01-31',
  contractYearMonth: '2025-01',
  depositAmountManwon: 90000,
  monthlyRentManwon: 0,
}

describe('TransactionCard', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('shows only the address text and preserves list context when the address is clicked', () => {
    window.history.pushState({}, '', '/results?regionCode5=11680&q=%EA%B0%95%EB%82%A8%EA%B5%AC&sourceType=apartment&rentType=sale')
    render(<TransactionCard transaction={transaction} />)

    fireEvent.click(screen.getByRole('link', { name: '서울특별시 강남구 개포동 1-1' }))

    expect(window.location.pathname).toBe('/map')
    const params = new URLSearchParams(window.location.search)
    expect(params.get('address')).toBe('서울특별시 강남구 개포동 1-1')
    expect(params.get('buildingName')).toBe('개포우성2')
    expect(params.get('transactionId')).toBe('1')
    expect(params.get('returnTo')).toBe('/results?regionCode5=11680&q=%EA%B0%95%EB%82%A8%EA%B5%AC&sourceType=apartment&rentType=sale')
    expect(screen.queryByText(/지도에서 보기/)).not.toBeInTheDocument()
  })

  it('displays rent and housing types as Korean labels in transaction details', () => {
    render(<TransactionCard transaction={transaction} />)

    fireEvent.click(screen.getByRole('button', { name: '개포우성2 거래 상세 열기' }))

    expect(screen.getByText('거래유형 : 전세')).toBeInTheDocument()
    expect(screen.getByText('주거유형 : 아파트')).toBeInTheDocument()
    expect(screen.queryByText(/jeonse|apartment/)).not.toBeInTheDocument()
  })

  it('displays sale transactions with sale price labels', () => {
    render(<TransactionCard transaction={{ ...transaction, rentType: 'sale', depositAmountManwon: 215000 }} />)

    expect(screen.getByText('매매가 21억 5,000만원')).toBeInTheDocument()
    expect(screen.queryByText(/보증금/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '개포우성2 거래 상세 열기' }))
    expect(screen.getByText('거래유형 : 매매')).toBeInTheDocument()
  })
})
