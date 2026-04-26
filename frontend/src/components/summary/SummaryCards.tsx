import type { SummaryResponse } from '../../api/summaries'
import { formatManwon } from '../../utils/formatMoney'

interface SummaryCardsProps {
  summary: SummaryResponse | null
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) {
    return <p className="empty-state">요약 데이터가 없습니다.</p>
  }

  return (
    <section className="result-panel" aria-labelledby="summary-heading">
      <h2 id="summary-heading">요약</h2>
      <div className="summary-grid">
        <article className="summary-card">거래 {summary.transactionCount.toLocaleString('ko-KR')}건</article>
        <article className="summary-card">평균 보증금 {formatManwon(summary.avgDepositManwon)}</article>
        <article className="summary-card">평균 월세 {formatManwon(summary.avgMonthlyRentManwon)}</article>
        <article className="summary-card">
          {summary.latestMonth ? `${summary.latestMonth} 기준` : '최근 거래 없음'}
        </article>
      </div>
      {summary.sampleWarning ? <p className="warning-text">{summary.sampleWarning}</p> : null}
    </section>
  )
}
