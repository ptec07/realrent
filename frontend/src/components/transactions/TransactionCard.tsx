import { useState } from 'react'

import type { TransactionItem } from '../../api/transactions'
import { formatAreaM2 } from '../../utils/formatArea'
import { formatManwon } from '../../utils/formatMoney'

interface TransactionCardProps {
  transaction: TransactionItem
}

function formatAddress(transaction: TransactionItem) {
  return [transaction.regionSido, transaction.regionSigungu, transaction.regionDong].filter(Boolean).join(' ')
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  return (
    <article className="transaction-card">
      <h3>{transaction.buildingName}</h3>
      <p>
        {formatAddress(transaction)} · {formatAreaM2(transaction.areaM2)} · {transaction.floor ?? '-'}층
      </p>
      <p>
        보증금 {formatManwon(transaction.depositAmountManwon)} / 월세 {formatManwon(transaction.monthlyRentManwon)}
      </p>
      <p className="muted-text">계약일 {transaction.contractDate}</p>
      <button className="secondary-action" type="button" onClick={() => setIsDetailOpen((current) => !current)}>
        {transaction.buildingName} 거래 상세 {isDetailOpen ? '닫기' : '열기'}
      </button>
      {isDetailOpen ? (
        <div className="transaction-detail">
          <p>
            지번 {transaction.addressJibun || '-'} · 준공 {transaction.builtYear ?? '-'}년
          </p>
          <p>
            거래 유형 {transaction.rentType} · 주거 유형 {transaction.sourceType}
          </p>
        </div>
      ) : null}
    </article>
  )
}
