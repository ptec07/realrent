import type { CompareDiff, CompareRegionSummary } from '../../api/compare'
import { formatManwon, formatSignedManwon } from '../../utils/formatMoney'

interface CompareSummaryCardsProps {
  regionA: CompareRegionSummary
  regionB: CompareRegionSummary
  diff: CompareDiff | null
}

function regionLine(region: CompareRegionSummary) {
  return `거래 ${region.transactionCount.toLocaleString('ko-KR')}건 · 평균 보증금 ${formatManwon(
    region.avgDepositManwon,
  )} · 평균 월세 ${formatManwon(region.avgMonthlyRentManwon)}`
}

export default function CompareSummaryCards({ regionA, regionB, diff }: CompareSummaryCardsProps) {
  return (
    <section className="result-panel" aria-labelledby="compare-summary-heading">
      <h2 id="compare-summary-heading">비교 요약</h2>
      <div className="compare-summary-grid">
        <article className="summary-card">
          <h3>지역 A · {regionA.regionCode5}</h3>
          <p>{regionLine(regionA)}</p>
        </article>
        <article className="summary-card">
          <h3>지역 B · {regionB.regionCode5}</h3>
          <p>{regionLine(regionB)}</p>
        </article>
        <article className="summary-card">보증금 차이 {formatSignedManwon(diff?.depositManwon)}</article>
        <article className="summary-card">월세 차이 {formatSignedManwon(diff?.monthlyRentManwon)}</article>
      </div>
    </section>
  )
}
