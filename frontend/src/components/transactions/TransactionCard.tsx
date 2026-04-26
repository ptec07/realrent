import { useState, type MouseEvent } from 'react'

import type { TransactionItem } from '../../api/transactions'
import { formatAreaM2 } from '../../utils/formatArea'
import { formatManwon } from '../../utils/formatMoney'
import { navigateTo } from '../../utils/navigation'

interface TransactionCardProps {
  transaction: TransactionItem
}

function formatAddress(transaction: TransactionItem) {
  return [transaction.regionSido, transaction.regionSigungu, transaction.regionDong].filter(Boolean).join(' ')
}

function formatFullAddress(transaction: TransactionItem) {
  return [formatAddress(transaction), transaction.addressJibun].filter(Boolean).join(' ')
}

function formatRentType(rentType: TransactionItem['rentType']) {
  if (rentType === 'jeonse') return '전세'
  if (rentType === 'monthly') return '월세'
  return '매매'
}

function formatHousingType(sourceType: TransactionItem['sourceType']) {
  return sourceType === 'apartment' ? '아파트' : '오피스텔'
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const fullAddress = formatFullAddress(transaction)

  function handleAddressClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    const params = new URLSearchParams({ address: fullAddress, buildingName: transaction.buildingName })
    navigateTo(`/map?${params.toString()}`)
  }

  return (
    <article className="transaction-card">
      <h3>{transaction.buildingName}</h3>
      <p>
        <a className="address-link" href={`/map?${new URLSearchParams({ address: fullAddress, buildingName: transaction.buildingName }).toString()}`} onClick={handleAddressClick}>
          {fullAddress} 지도에서 보기
        </a>{' '}
        · {formatAreaM2(transaction.areaM2)} · {transaction.floor ?? '-'}층
      </p>
      <p>
        {transaction.rentType === 'sale' ? (
          <>매매가 {formatManwon(transaction.depositAmountManwon)}</>
        ) : (
          <>보증금 {formatManwon(transaction.depositAmountManwon)} / 월세 {formatManwon(transaction.monthlyRentManwon)}</>
        )}
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
