import { useEffect, useMemo, useState } from 'react'

import { getCompare, type CompareResponse } from '../api/compare'
import type { HousingType, RentType } from '../api/transactions'
import CompareInsightText from '../components/compare/CompareInsightText'
import CompareRegionPicker from '../components/compare/CompareRegionPicker'
import CompareSummaryCards from '../components/compare/CompareSummaryCards'
import { navigateTo } from '../utils/navigation'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

interface CompareFilters {
  regionA: string
  regionB: string
  sourceType?: HousingType
  rentType?: RentType
}

function parseFilters(search: string): CompareFilters {
  const params = new URLSearchParams(search)
  return {
    regionA: params.get('regionA') ?? '',
    regionB: params.get('regionB') ?? '',
    sourceType: (params.get('sourceType') || undefined) as HousingType | undefined,
    rentType: (params.get('rentType') || undefined) as RentType | undefined,
  }
}

function buildCompareUrl(filters: CompareFilters) {
  const params = new URLSearchParams()
  if (filters.regionA.trim()) {
    params.set('regionA', filters.regionA.trim())
  }
  if (filters.regionB.trim()) {
    params.set('regionB', filters.regionB.trim())
  }
  if (filters.sourceType) {
    params.set('sourceType', filters.sourceType)
  }
  if (filters.rentType) {
    params.set('rentType', filters.rentType)
  }
  return `/compare?${params.toString()}`
}

export default function ComparePage() {
  const initialFilters = useMemo(() => parseFilters(window.location.search), [])
  const [filters, setFilters] = useState<CompareFilters>(initialFilters)
  const [regionAInput, setRegionAInput] = useState(initialFilters.regionA)
  const [regionBInput, setRegionBInput] = useState(initialFilters.regionB)
  const [status, setStatus] = useState<LoadState>('idle')
  const [comparison, setComparison] = useState<CompareResponse | null>(null)

  useEffect(() => {
    if (!filters.regionA || !filters.regionB) {
      return
    }

    setStatus('loading')
    getCompare({
      regionA: filters.regionA,
      regionB: filters.regionB,
      sourceType: filters.sourceType,
      rentType: filters.rentType,
      months: 12,
    })
      .then((response) => {
        setComparison(response)
        setStatus('success')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [filters])

  function handleSubmit() {
    const nextFilters = {
      ...filters,
      regionA: regionAInput.trim(),
      regionB: regionBInput.trim(),
    }
    navigateTo(buildCompareUrl(nextFilters))
    setFilters(nextFilters)
  }

  return (
    <main className="app-shell results-shell">
      <section className="results-page">
        <p className="eyebrow">RealRent MVP</p>
        <h1>지역 비교</h1>
        <p className="lead">두 지역의 평균 보증금과 월세를 비교합니다.</p>

        <CompareRegionPicker
          regionA={regionAInput}
          regionB={regionBInput}
          onRegionAChange={setRegionAInput}
          onRegionBChange={setRegionBInput}
          onSubmit={handleSubmit}
        />

        {!filters.regionA || !filters.regionB ? (
          <p className="empty-state">비교할 두 지역 코드를 입력해 주세요.</p>
        ) : null}
        {status === 'loading' ? <p className="empty-state">비교 결과를 불러오는 중입니다.</p> : null}
        {status === 'error' ? <p className="empty-state">비교 결과를 불러오지 못했습니다.</p> : null}

        {status === 'success' && comparison ? (
          <div className="results-grid">
            <CompareSummaryCards regionA={comparison.regionA} regionB={comparison.regionB} diff={comparison.diff} />
            <CompareInsightText insight={comparison.insight} />
          </div>
        ) : null}
      </section>
    </main>
  )
}
