import { useEffect, useMemo, useState } from 'react'

import { getSummary, type SummaryResponse } from '../api/summaries'
import { getTransactions, type HousingType, type RentType, type TransactionListResponse } from '../api/transactions'
import { getTrends, type TrendsResponse } from '../api/trends'
import TrendChart from '../components/charts/TrendChart'
import SummaryCards from '../components/summary/SummaryCards'
import TransactionList from '../components/transactions/TransactionList'
import { navigateTo } from '../utils/navigation'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

interface ResultFilters {
  regionCode5: string
  q: string
  sourceType?: HousingType
  rentType?: RentType
  depositMax?: number
  monthlyRentMax?: number
}

function optionalNumber(value: string | null) {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseFilters(search: string): ResultFilters {
  const params = new URLSearchParams(search)
  return {
    regionCode5: params.get('regionCode5') ?? '',
    q: params.get('q') ?? '',
    sourceType: (params.get('sourceType') || undefined) as HousingType | undefined,
    rentType: (params.get('rentType') || undefined) as RentType | undefined,
    depositMax: optionalNumber(params.get('depositMax')),
    monthlyRentMax: optionalNumber(params.get('monthlyRentMax')),
  }
}

function buildCompareUrl(filters: ResultFilters) {
  const params = new URLSearchParams()
  if (filters.regionCode5) {
    params.set('regionA', filters.regionCode5)
  }
  if (filters.sourceType) {
    params.set('sourceType', filters.sourceType)
  }
  if (filters.rentType) {
    params.set('rentType', filters.rentType)
  }
  return `/compare?${params.toString()}`
}

export default function SearchResultsPage() {
  const filters = useMemo(() => parseFilters(window.location.search), [])
  const [status, setStatus] = useState<LoadState>('idle')
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [trends, setTrends] = useState<TrendsResponse | null>(null)
  const [transactions, setTransactions] = useState<TransactionListResponse | null>(null)

  useEffect(() => {
    if (!filters.regionCode5) {
      return
    }

    const commonParams = {
      regionCode5: filters.regionCode5,
      sourceType: filters.sourceType,
      rentType: filters.rentType,
      months: 12,
    }
    const transactionParams = {
      regionCode5: filters.regionCode5,
      sourceType: filters.sourceType,
      rentType: filters.rentType,
      depositMax: filters.depositMax,
      monthlyRentMax: filters.monthlyRentMax,
      page: 1,
      pageSize: 20,
      sort: 'latest' as const,
    }

    setStatus('loading')
    Promise.all([getSummary(commonParams), getTrends(commonParams), getTransactions(transactionParams)])
      .then(([summaryResponse, trendsResponse, transactionsResponse]) => {
        setSummary(summaryResponse)
        setTrends(trendsResponse)
        setTransactions(transactionsResponse)
        setStatus('success')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [filters])

  function handleCompareClick() {
    navigateTo(buildCompareUrl(filters))
  }

  return (
    <main className="app-shell results-shell">
      <section className="results-page">
        <p className="eyebrow">RealRent MVP</p>
        <h1>검색 결과</h1>
        <p className="lead">{filters.q || filters.regionCode5 || '선택한 지역'}의 전월세 실거래 요약입니다.</p>
        {filters.regionCode5 ? (
          <button className="secondary-action" type="button" onClick={handleCompareClick}>
            지역 비교하기
          </button>
        ) : null}

        {!filters.regionCode5 ? <p className="empty-state">지역 코드가 없어 결과를 불러올 수 없습니다.</p> : null}
        {status === 'loading' ? <p className="empty-state">결과를 불러오는 중입니다.</p> : null}
        {status === 'error' ? <p className="empty-state">결과를 불러오지 못했습니다.</p> : null}

        {status === 'success' ? (
          <div className="results-grid">
            <SummaryCards summary={summary} />
            <TrendChart points={trends?.points ?? []} />
            <TransactionList items={transactions?.items ?? []} total={transactions?.total ?? 0} />
          </div>
        ) : null}
      </section>
    </main>
  )
}
