import { useEffect, useMemo, useState } from 'react'

import { getTrends, type TrendsResponse } from '../api/trends'
import type { HousingType, RentType } from '../api/transactions'
import { formatManwon } from '../utils/formatMoney'

type LoadState = 'idle' | 'loading' | 'success' | 'error'
type TrendMetricKey = 'apartment-sale' | 'apartment-rent' | 'officetel-sale' | 'officetel-rent'

interface PriceTrendFilters {
  regionA: string
  regionB: string
  dongA?: string
  dongB?: string
  months: number
}

interface TrendMetric {
  key: TrendMetricKey
  title: string
  sourceType: HousingType
  rentType: RentType
}

const DEFAULT_TREND_MONTHS = 3
const TREND_METRICS: TrendMetric[] = [
  { key: 'apartment-sale', title: '아파트 평균매매가', sourceType: 'apartment', rentType: 'sale' },
  { key: 'apartment-rent', title: '아파트 전월세', sourceType: 'apartment', rentType: 'all' },
  { key: 'officetel-sale', title: '오피스텔 평균매매가', sourceType: 'officetel', rentType: 'sale' },
  { key: 'officetel-rent', title: '오피스텔 전월세', sourceType: 'officetel', rentType: 'all' },
]

function parseFilters(search: string): PriceTrendFilters {
  const params = new URLSearchParams(search)
  const parsedMonths = Number(params.get('months') ?? DEFAULT_TREND_MONTHS)
  return {
    regionA: params.get('regionA') ?? '',
    dongA: params.get('dongA') ?? undefined,
    regionB: params.get('regionB') ?? '',
    dongB: params.get('dongB') ?? undefined,
    months: Number.isFinite(parsedMonths) && parsedMonths > 0 ? parsedMonths : DEFAULT_TREND_MONTHS,
  }
}

function buildUrl(filters: PriceTrendFilters) {
  const params = new URLSearchParams()
  if (filters.regionA) params.set('regionA', filters.regionA)
  if (filters.dongA) params.set('dongA', filters.dongA)
  if (filters.regionB) params.set('regionB', filters.regionB)
  if (filters.dongB) params.set('dongB', filters.dongB)
  params.set('months', String(filters.months || DEFAULT_TREND_MONTHS))
  return `/price-trends?${params.toString()}`
}

function getPointValue(response: TrendsResponse | null, month: string, isSale: boolean) {
  const point = response?.points.find((item) => item.month === month)
  if (!point) return null
  return isSale ? point.avgDepositManwon : point.avgDepositManwon
}

function makePolyline(values: Array<number | null>, width: number, height: number) {
  const numericValues = values.filter((value): value is number => value !== null)
  if (numericValues.length === 0) return ''
  const min = Math.min(...numericValues)
  const max = Math.max(...numericValues)
  const range = Math.max(max - min, 1)
  const step = values.length > 1 ? width / (values.length - 1) : width
  return values
    .map((value, index) => {
      if (value === null) return null
      const x = index * step
      const y = height - ((value - min) / range) * (height - 20) - 10
      return `${x},${y}`
    })
    .filter(Boolean)
    .join(' ')
}

function TrendLineChart({ title, regionA, regionB, isSale }: { title: string; regionA: TrendsResponse | null; regionB: TrendsResponse | null; isSale: boolean }) {
  const months = Array.from(new Set([...(regionA?.points.map((point) => point.month) ?? []), ...(regionB?.points.map((point) => point.month) ?? [])])).sort()
  const width = 640
  const height = 180
  const valuesA = months.map((month) => getPointValue(regionA, month, isSale))
  const valuesB = months.map((month) => getPointValue(regionB, month, isSale))

  return (
    <section className="result-panel">
      <h2>{title}</h2>
      <svg className="line-chart" role="img" aria-label="가격추이 꺾은선 그래프" viewBox={`0 0 ${width} ${height}`}>
        <polyline className="line-a" points={makePolyline(valuesA, width, height)} fill="none" strokeWidth="4" />
        <polyline className="line-b" points={makePolyline(valuesB, width, height)} fill="none" strokeWidth="4" />
      </svg>
      <ul className="trend-list">
        {months.map((month, index) => (
          <li key={month}>
            {month}: 기준 동 {formatManwon(valuesA[index])} · 선택 동 {formatManwon(valuesB[index])}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function PriceTrendsPage() {
  const initialFilters = useMemo(() => parseFilters(window.location.search), [])
  const [filters, setFilters] = useState(initialFilters)
  const [months, setMonths] = useState(String(initialFilters.months || DEFAULT_TREND_MONTHS))
  const [status, setStatus] = useState<LoadState>('idle')
  const [trends, setTrends] = useState<Record<TrendMetricKey, { regionA: TrendsResponse | null; regionB: TrendsResponse | null }>>({
    'apartment-sale': { regionA: null, regionB: null },
    'apartment-rent': { regionA: null, regionB: null },
    'officetel-sale': { regionA: null, regionB: null },
    'officetel-rent': { regionA: null, regionB: null },
  })

  useEffect(() => {
    if (!filters.regionA || !filters.regionB) return
    setStatus('loading')
    Promise.all(
      TREND_METRICS.map(async (metric) => {
        const [regionA, regionB] = await Promise.all([
          getTrends({ regionCode5: filters.regionA, dong: filters.dongA, sourceType: metric.sourceType, rentType: metric.rentType, months: filters.months }),
          getTrends({ regionCode5: filters.regionB, dong: filters.dongB, sourceType: metric.sourceType, rentType: metric.rentType, months: filters.months }),
        ])
        return { metric, regionA, regionB }
      }),
    )
      .then((responses) => {
        setTrends(
          responses.reduce(
            (acc, item) => ({ ...acc, [item.metric.key]: { regionA: item.regionA, regionB: item.regionB } }),
            {} as Record<TrendMetricKey, { regionA: TrendsResponse | null; regionB: TrendsResponse | null }>,
          ),
        )
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [filters])

  function handleMonthsChange(nextMonths: string) {
    setMonths(nextMonths)
    const nextFilters = { ...filters, months: Number(nextMonths) || DEFAULT_TREND_MONTHS }
    window.history.pushState({}, '', buildUrl(nextFilters))
    setFilters(nextFilters)
  }

  return (
    <main className="app-shell results-shell">
      <section className="results-page">
        <p className="eyebrow">RealRent MVP</p>
        <h1>실거래가 변동</h1>
        <p className="lead">최근 계약월 기준 선택 기간의 실거래가 변동을 꺾은선 그래프로 비교합니다.</p>
        <section className="result-panel">
          <label className="field-group" htmlFor="trend-months">
            <span>비교 기간</span>
            <select id="trend-months" value={months} onChange={(event) => handleMonthsChange(event.target.value)}>
              <option value="3">최근 3개월</option>
              <option value="6">최근 6개월</option>
              <option value="12">최근 12개월</option>
              <option value="24">최근 24개월</option>
            </select>
          </label>
        </section>
        {status === 'loading' ? <p className="empty-state">가격추이를 불러오는 중입니다.</p> : null}
        {status === 'error' ? <p className="empty-state">가격추이를 불러오지 못했습니다.</p> : null}
        {status === 'success' ? (
          <div className="results-grid">
            {TREND_METRICS.map((metric) => (
              <TrendLineChart
                key={metric.key}
                title={metric.title}
                regionA={trends[metric.key]?.regionA ?? null}
                regionB={trends[metric.key]?.regionB ?? null}
                isSale={metric.rentType === 'sale'}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  )
}
