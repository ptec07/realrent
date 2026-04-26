import type { SummaryResponse } from '../../api/summaries'
import { formatManwon } from '../../utils/formatMoney'

interface SummaryCardsProps {
  summary: SummaryResponse | null
  isSale?: boolean
}

export default function SummaryCards({ summary, isSale = false }: SummaryCardsProps) {
  if (!summary) {
    return <p className="empty-state">요약 데이터가 없습니다.</p>
  }

  const priceLabel = isSale ? '평균 매매가' : '평균 보증금'

  return (
    <section className="result-panel" aria-labelledby="summary-heading">
      <h2 id="summary-heading">요약</h2>
      <div className="summary-grid">
        <article className="summary-card">거래 {summary.transactionCount.toLocaleString('ko-KR')}건</article>
        <article className="summary-card">{priceLabel} {formatManwon(summary.avgDepositManwon)}</article>
        {!isSale ? <article className="summary-card">평균 월세 {formatManwon(summary.avgMonthlyRentManwon)}</article> : null}
        <article className="summary-card">
          {summary.latestMonth ? `${summary.latestMonth} 기준` : '최근 거래 없음'}
        </article>
      </div>
      {summary.sampleWarning ? <p className="warning-text">{summary.sampleWarning}</p> : null}
    </section>
  )
}
