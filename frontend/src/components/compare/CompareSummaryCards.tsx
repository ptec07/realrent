import type { CompareDiff, CompareRegionSummary } from '../../api/compare'
import { formatManwon, formatSignedManwon } from '../../utils/formatMoney'

interface CompareSummaryCardsProps {
  regionA: CompareRegionSummary
  regionB: CompareRegionSummary
  diff: CompareDiff | null
  isSale?: boolean
}

function regionLine(region: CompareRegionSummary, isSale: boolean) {
  const priceLabel = isSale ? '평균 매매가' : '평균 보증금'
  const rentPart = isSale ? '' : ` · 평균 월세 ${formatManwon(region.avgMonthlyRentManwon)}`
  return `거래 ${region.transactionCount.toLocaleString('ko-KR')}건 · ${priceLabel} ${formatManwon(
    region.avgDepositManwon,
  )}${rentPart}`
}

export default function CompareSummaryCards({ regionA, regionB, diff, isSale = false }: CompareSummaryCardsProps) {
  return (
    <section className="result-panel" aria-labelledby="compare-summary-heading">
      <h2 id="compare-summary-heading">비교 요약</h2>
      <div className="compare-summary-grid">
        <article className="summary-card">
          <h3>기준 지역</h3>
          <p>{regionLine(regionA, isSale)}</p>
        </article>
        <article className="summary-card">
          <h3>비교 지역</h3>
          <p>{regionLine(regionB, isSale)}</p>
        </article>
        <article className="summary-card">{isSale ? '매매가 차이' : '보증금 차이'} {formatSignedManwon(diff?.depositManwon)}</article>
        {isSale ? null : <article className="summary-card">월세 차이 {formatSignedManwon(diff?.monthlyRentManwon)}</article>}
      </div>
    </section>
  )
}
