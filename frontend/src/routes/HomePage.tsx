import { useEffect, useState, type FormEvent } from 'react'

import BudgetFilterPanel from '../components/filters/BudgetFilterPanel'
import HousingTypeToggle, { type HousingTypeFilter } from '../components/filters/HousingTypeToggle'
import RentTypeToggle, { type RentTypeFilter } from '../components/filters/RentTypeToggle'
import RegionSearchBox from '../components/search/RegionSearchBox'
import { searchRegions, type RegionItem } from '../api/regions'
import { navigateTo } from '../utils/navigation'

function buildResultsUrl(params: {
  q: string
  sourceType: HousingTypeFilter
  rentType: RentTypeFilter
  depositMax: string
  monthlyRentMax: string
  regionCode5: string
}) {
  const query = new URLSearchParams({
    q: params.q.trim(),
    sourceType: params.sourceType,
    rentType: params.rentType,
  })

  if (params.depositMax.trim()) {
    query.set('depositMax', params.depositMax.trim())
  }
  if (params.monthlyRentMax.trim()) {
    query.set('monthlyRentMax', params.monthlyRentMax.trim())
  }
  if (params.regionCode5.trim()) {
    query.set('regionCode5', params.regionCode5.trim())
  }

  return `/results?${query.toString()}`
}

export default function HomePage() {
  const [regionQuery, setRegionQuery] = useState('')
  const [sourceType, setSourceType] = useState<HousingTypeFilter>('apartment')
  const [rentType, setRentType] = useState<RentTypeFilter>('all')
  const [depositMax, setDepositMax] = useState('')
  const [monthlyRentMax, setMonthlyRentMax] = useState('')
  const [regionSuggestions, setRegionSuggestions] = useState<RegionItem[]>([])
  const [selectedRegionCode5, setSelectedRegionCode5] = useState('')

  useEffect(() => {
    const query = regionQuery.trim()
    if (query.length < 2) {
      setRegionSuggestions([])
      return
    }

    let active = true
    searchRegions(query)
      .then((response) => {
        if (active) {
          setRegionSuggestions(response.items)
        }
      })
      .catch(() => {
        if (active) {
          setRegionSuggestions([])
        }
      })

    return () => {
      active = false
    }
  }, [regionQuery])

  function handleRegionQueryChange(nextQuery: string) {
    setRegionQuery(nextQuery)
    setSelectedRegionCode5('')
  }

  function handleRegionSelect(region: RegionItem) {
    setRegionQuery(region.dong || region.fullName)
    setSelectedRegionCode5(region.regionCode5)
    setRegionSuggestions([region])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fallbackRegionCode5 = regionSuggestions[0]?.regionCode5 ?? ''
    const nextUrl = buildResultsUrl({
      q: regionQuery,
      sourceType,
      rentType,
      depositMax,
      monthlyRentMax,
      regionCode5: selectedRegionCode5 || fallbackRegionCode5,
    })
    navigateTo(nextUrl)
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">RealRent MVP</p>
        <h1>리얼랜트</h1>
        <p className="lead">서울·수도권 전월세 실거래가를 검색하고 비교하는 웹 서비스</p>

        <form className="search-card" aria-label="지역 검색" onSubmit={handleSubmit}>
          <RegionSearchBox
            value={regionQuery}
            onChange={handleRegionQueryChange}
            suggestions={regionSuggestions}
            selectedRegionCode5={selectedRegionCode5}
            onSelect={handleRegionSelect}
          />
          <div className="filter-grid" aria-label="검색 필터">
            <HousingTypeToggle value={sourceType} onChange={setSourceType} />
            <RentTypeToggle value={rentType} onChange={setRentType} />
          </div>
          <BudgetFilterPanel
            depositMax={depositMax}
            monthlyRentMax={monthlyRentMax}
            onDepositMaxChange={setDepositMax}
            onMonthlyRentMaxChange={setMonthlyRentMax}
          />
          <button className="primary-action" type="submit">
            검색
          </button>
        </form>
      </section>
    </main>
  )
}
