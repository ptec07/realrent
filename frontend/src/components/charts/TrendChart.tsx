import type { TrendPoint } from '../../api/trends'
import { formatManwon } from '../../utils/formatMoney'

interface TrendChartProps {
  points: TrendPoint[]
  isSale?: boolean
}

export default function TrendChart({ points, isSale = false }: TrendChartProps) {
  return (
    <section className="result-panel" aria-labelledby="trend-heading">
      <h2 id="trend-heading">월별 추이</h2>
      {points.length === 0 ? (
        <p className="empty-state">월별 추이 데이터가 없습니다.</p>
      ) : (
        <ol className="trend-list">
          {points.map((point) => (
            <li key={point.month}>
              {isSale
                ? `${point.month}: 매매가 ${formatManwon(point.avgDepositManwon)} · ${point.transactionCount.toLocaleString('ko-KR')}건`
                : `${point.month}: 보증금 ${formatManwon(point.avgDepositManwon)} · 월세 ${formatManwon(point.avgMonthlyRentManwon)} · ${point.transactionCount.toLocaleString('ko-KR')}건`}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
