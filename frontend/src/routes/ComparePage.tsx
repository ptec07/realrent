import { useEffect, useMemo, useState, type MouseEvent } from 'react'

import { getCompare, type CompareResponse } from '../api/compare'
import { listRegionHierarchy, type RegionItem } from '../api/regions'
import type { HousingType, RentType } from '../api/transactions'
import CompareInsightText from '../components/compare/CompareInsightText'
import CompareSummaryCards from '../components/compare/CompareSummaryCards'
import RegionHierarchySelect from '../components/search/RegionHierarchySelect'
import { navigateTo } from '../utils/navigation'

type LoadState = 'idle' | 'loading' | 'success' | 'error'

type CompareMetricKey = 'apartment-sale' | 'apartment-rent' | 'officetel-sale' | 'officetel-rent'

interface CompareFilters {
  regionA: string
  regionB: string
  dongA?: string
  dongB?: string
  sourceType?: HousingType
  rentType?: RentType
  months: number
}

interface CompareMetric {
  key: CompareMetricKey
  title: string
  sourceType: HousingType
  rentType: RentType
}

const DEFAULT_COMPARE_MONTHS = 3
const COMPARE_METRICS: CompareMetric[] = [
  { key: 'apartment-sale', title: '아파트 평균매매가', sourceType: 'apartment', rentType: 'sale' },
  { key: 'apartment-rent', title: '아파트 전월세', sourceType: 'apartment', rentType: 'all' },
  { key: 'officetel-sale', title: '오피스텔 평균매매가', sourceType: 'officetel', rentType: 'sale' },
  { key: 'officetel-rent', title: '오피스텔 전월세', sourceType: 'officetel', rentType: 'all' },
]

function parseFilters(search: string): CompareFilters {
  const params = new URLSearchParams(search)
  const parsedMonths = Number(params.get('months') ?? DEFAULT_COMPARE_MONTHS)
  return {
    regionA: params.get('regionA') ?? '',
    regionB: params.get('regionB') ?? '',
    dongA: params.get('dongA') ?? undefined,
    dongB: params.get('dongB') ?? undefined,
    sourceType: (params.get('sourceType') || undefined) as HousingType | undefined,
    rentType: (params.get('rentType') || undefined) as RentType | undefined,
    months: Number.isFinite(parsedMonths) && parsedMonths > 0 ? parsedMonths : DEFAULT_COMPARE_MONTHS,
  }
}

function buildCompareUrl(filters: CompareFilters) {
  const params = new URLSearchParams()
  if (filters.regionA.trim()) {
    params.set('regionA', filters.regionA.trim())
  }
  if (filters.dongA?.trim()) {
    params.set('dongA', filters.dongA.trim())
  }
  if (filters.regionB.trim()) {
    params.set('regionB', filters.regionB.trim())
  }
  if (filters.dongB?.trim()) {
    params.set('dongB', filters.dongB.trim())
  }
  params.set('months', String(filters.months || DEFAULT_COMPARE_MONTHS))
  return `/compare?${params.toString()}`
}


function buildResultsUrl(filters: CompareFilters) {
  const params = new URLSearchParams()
  if (filters.regionA.trim()) params.set('regionCode5', filters.regionA.trim())
  if (filters.dongA?.trim()) {
    params.set('dong', filters.dongA.trim())
    params.set('q', filters.dongA.trim())
  }
  return `/results?${params.toString()}`
}

function handleNavLinkClick(event: MouseEvent<HTMLAnchorElement>, url: string) {
  event.preventDefault()
  navigateTo(url)
}

export default function ComparePage() {
  const initialFilters = useMemo(() => parseFilters(window.location.search), [])
  const [filters, setFilters] = useState<CompareFilters>(initialFilters)
  const regionAInput = initialFilters.regionA
  const [regionBInput, setRegionBInput] = useState(initialFilters.regionB)
  const [months, setMonths] = useState(String(initialFilters.months || DEFAULT_COMPARE_MONTHS))
  const [status, setStatus] = useState<LoadState>('idle')
  const [comparisons, setComparisons] = useState<Record<CompareMetricKey, CompareResponse | null>>({
    'apartment-sale': null,
    'apartment-rent': null,
    'officetel-sale': null,
    'officetel-rent': null,
  })
  const [sidos, setSidos] = useState<string[]>([])
  const [sigungus, setSigungus] = useState<string[]>([])
  const [hierarchyDongs, setHierarchyDongs] = useState<RegionItem[]>([])
  const [selectedSido, setSelectedSido] = useState('')
  const [selectedSigungu, setSelectedSigungu] = useState('')
  const [selectedDong, setSelectedDong] = useState(initialFilters.dongB ?? '')
  const [selectedHierarchyRegion, setSelectedHierarchyRegion] = useState<RegionItem | null>(null)

  useEffect(() => {
    let active = true
    listRegionHierarchy()
      .then((response) => {
        if (active) setSidos(response.sidos)
      })
      .catch(() => {
        if (active) setSidos([])
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setSigungus([])
    setHierarchyDongs([])
    setSelectedSigungu('')
    if (!selectedSido) return
    let active = true
    listRegionHierarchy({ sido: selectedSido })
      .then((response) => {
        if (active) {
          setSidos(response.sidos)
          setSigungus(response.sigungus)
        }
      })
      .catch(() => {
        if (active) setSigungus([])
      })
    return () => {
      active = false
    }
  }, [selectedSido])

  useEffect(() => {
    setHierarchyDongs([])
    if (!selectedSido || !selectedSigungu) return
    let active = true
    listRegionHierarchy({ sido: selectedSido, sigungu: selectedSigungu })
      .then((response) => {
        if (active) {
          setSidos(response.sidos)
          setSigungus(response.sigungus)
          setHierarchyDongs(response.dongs)
        }
      })
      .catch(() => {
        if (active) setHierarchyDongs([])
      })
    return () => {
      active = false
    }
  }, [selectedSido, selectedSigungu])

  useEffect(() => {
    if (!filters.regionA || !filters.regionB) {
      return
    }

    setStatus('loading')
    Promise.all(
      COMPARE_METRICS.map((metric) =>
        getCompare({
          regionA: filters.regionA,
          dongA: filters.dongA,
          regionB: filters.regionB,
          dongB: filters.dongB,
          sourceType: metric.sourceType,
          rentType: metric.rentType,
          months: filters.months,
        }),
      ),
    )
      .then((responses) => {
        setComparisons(
          COMPARE_METRICS.reduce(
            (acc, metric, index) => ({ ...acc, [metric.key]: responses[index] }),
            {} as Record<CompareMetricKey, CompareResponse | null>,
          ),
        )
        setStatus('success')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [filters])

  function handleSidoChange(nextSido: string) {
    setSelectedSido(nextSido)
    setSelectedSigungu('')
    setSelectedDong('')
    setSelectedHierarchyRegion(null)
  }

  function handleSigunguChange(nextSigungu: string) {
    setSelectedSigungu(nextSigungu)
    setSelectedDong('')
    setSelectedHierarchyRegion(null)
  }

  function handleDongChange(nextDong: string) {
    setSelectedDong(nextDong)
    const matchingRegion = hierarchyDongs.find((region) => region.dong === nextDong) ?? null
    setSelectedHierarchyRegion(matchingRegion)
    if (matchingRegion) {
      setRegionBInput(matchingRegion.regionCode5)
    }
  }

  function handleSubmit() {
    const nextMonths = Number(months) || DEFAULT_COMPARE_MONTHS
    const nextFilters = {
      ...filters,
      regionA: regionAInput.trim(),
      regionB: selectedHierarchyRegion?.regionCode5 ?? regionBInput.trim(),
      dongB: selectedHierarchyRegion?.dong ?? (selectedDong || filters.dongB),
      months: nextMonths,
    }
    navigateTo(buildCompareUrl(nextFilters))
    setFilters(nextFilters)
  }

  function handleMonthsChange(nextMonths: string) {
    setMonths(nextMonths)
    const parsed = Number(nextMonths) || DEFAULT_COMPARE_MONTHS
    const nextFilters = { ...filters, months: parsed }
    navigateTo(buildCompareUrl(nextFilters))
    setFilters(nextFilters)
  }

  const resultsUrl = buildResultsUrl(filters)
  const primaryComparison = comparisons['apartment-sale'] ?? comparisons['apartment-rent']

  return (
    <main className="app-shell results-shell">
      <section className="results-page">
        <p className="eyebrow">RealRent MVP</p>
        <h1>지역 비교</h1>
        <p className="lead">결과로 보고 있던 동과 새로 선택한 동의 아파트·오피스텔 평균매매가와 전월세를 비교합니다.</p>
        <div className="page-action-row">
          <a className="secondary-action main-screen-link" href="/" onClick={(event) => handleNavLinkClick(event, '/')}>
            메인화면
          </a>
          <a className="secondary-action results-screen-link" href={resultsUrl} onClick={(event) => handleNavLinkClick(event, resultsUrl)}>
            검색결과
          </a>
        </div>

        <section className="result-panel compare-control-panel" aria-label="지역 비교 조건">
          <label className="field-group" htmlFor="compare-months">
            <span>비교 기간</span>
            <select id="compare-months" value={months} onChange={(event) => handleMonthsChange(event.target.value)}>
              <option value="3">최근 3개월</option>
              <option value="6">최근 6개월</option>
              <option value="12">최근 12개월</option>
              <option value="24">최근 24개월</option>
            </select>
          </label>
          <p className="empty-state compact">기간은 각 조건의 가장 최근 계약월을 기준으로 과거 선택 개월치를 집계합니다.</p>
          <RegionHierarchySelect
            sidos={sidos}
            sigungus={sigungus}
            dongs={hierarchyDongs}
            selectedSido={selectedSido}
            selectedSigungu={selectedSigungu}
            selectedDong={selectedDong}
            onSidoChange={handleSidoChange}
            onSigunguChange={handleSigunguChange}
            onDongChange={handleDongChange}
          />
          <button className="primary-action" type="button" onClick={handleSubmit}>
            비교하기
          </button>
        </section>

        {!filters.regionA || !filters.regionB ? (
          <p className="empty-state">비교할 두 지역을 선택해 주세요.</p>
        ) : null}
        {status === 'loading' ? <p className="empty-state">비교 결과를 불러오는 중입니다.</p> : null}
        {status === 'error' ? <p className="empty-state">비교 결과를 불러오지 못했습니다.</p> : null}

        {status === 'success' ? (
          <div className="results-grid">
            {COMPARE_METRICS.map((metric) => {
              const comparison = comparisons[metric.key]
              return comparison ? (
                <div className="comparison-block" key={metric.key}>
                  <h2>{metric.title}</h2>
                  <CompareSummaryCards
                    regionA={comparison.regionA}
                    regionB={comparison.regionB}
                    diff={comparison.diff}
                    isSale={metric.rentType === 'sale'}
                  />
                </div>
              ) : null
            })}
            {primaryComparison ? <CompareInsightText insight={primaryComparison.insight} /> : null}
          </div>
        ) : null}
      </section>
    </main>
  )
}
