import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
  it('displays rent and housing types as Korean labels in transaction details', () => {
    render(<TransactionCard transaction={transaction} />)

    fireEvent.click(screen.getByRole('button', { name: '개포우성2 거래 상세 열기' }))

    expect(screen.getByText('거래유형 : 전세')).toBeInTheDocument()
    expect(screen.getByText('주거유형 : 아파트')).toBeInTheDocument()
    expect(screen.queryByText(/jeonse|apartment/)).not.toBeInTheDocument()
  })
})
