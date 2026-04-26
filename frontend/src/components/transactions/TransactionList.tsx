import type { TransactionItem } from '../../api/transactions'
import TransactionCard from './TransactionCard'

interface TransactionListProps {
  items: TransactionItem[]
  total: number
}

export default function TransactionList({ items, total }: TransactionListProps) {
  return (
    <section className="result-panel" aria-labelledby="transactions-heading">
      <h2 id="transactions-heading">실거래 목록</h2>
      <p className="muted-text">총 {total.toLocaleString('ko-KR')}건</p>
      {items.length === 0 ? (
        <p className="empty-state">조건에 맞는 실거래가 없습니다.</p>
      ) : (
        <div className="transaction-list">
          {items.map((item) => (
            <TransactionCard key={item.id} transaction={item} />
          ))}
        </div>
      )}
    </section>
  )
}
