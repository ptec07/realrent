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

function formatRentType(rentType: TransactionItem['rentType']) {
  return rentType === 'jeonse' ? '전세' : '월세'
}

function formatHousingType(sourceType: TransactionItem['sourceType']) {
  return sourceType === 'apartment' ? '아파트' : '오피스텔'
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
          <p>거래유형 : {formatRentType(transaction.rentType)}</p>
          <p>주거유형 : {formatHousingType(transaction.sourceType)}</p>
        </div>
      ) : null}
    </article>
  )
}
