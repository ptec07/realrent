import { useEffect, useState, type FormEvent } from 'react'

import BudgetFilterPanel from '../components/filters/BudgetFilterPanel'
import HousingTypeToggle, { type HousingTypeFilter } from '../components/filters/HousingTypeToggle'
import RentTypeToggle, { type RentTypeFilter } from '../components/filters/RentTypeToggle'
import RegionHierarchySelect from '../components/search/RegionHierarchySelect'
import RegionSearchBox from '../components/search/RegionSearchBox'
import { listRegionHierarchy, searchRegions, type RegionItem } from '../api/regions'
import { navigateTo } from '../utils/navigation'

function buildResultsUrl(params: {
  q: string
  sourceType: HousingTypeFilter
  rentType: RentTypeFilter
  depositMax: string
  monthlyRentMax: string
  regionCode5: string
  dong: string
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
  if (params.dong.trim()) {
    query.set('dong', params.dong.trim())
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
  const [sidos, setSidos] = useState<string[]>([])
  const [sigungus, setSigungus] = useState<string[]>([])
  const [hierarchyDongs, setHierarchyDongs] = useState<RegionItem[]>([])
  const [selectedSido, setSelectedSido] = useState('')
  const [selectedSigungu, setSelectedSigungu] = useState('')
  const [selectedDong, setSelectedDong] = useState('')
  const [selectedHierarchyRegion, setSelectedHierarchyRegion] = useState<RegionItem | null>(null)

  useEffect(() => {
    let active = true
    listRegionHierarchy()
      .then((response) => {
        if (active) {
          setSidos(response.sidos)
        }
      })
      .catch(() => {
        if (active) {
          setSidos([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setSigungus([])
    setHierarchyDongs([])
    setSelectedSigungu('')
    setSelectedDong('')
    setSelectedHierarchyRegion(null)
    if (!selectedSido) {
      return
    }

    let active = true
    listRegionHierarchy({ sido: selectedSido })
      .then((response) => {
        if (active) {
          setSidos(response.sidos)
          setSigungus(response.sigungus)
        }
      })
      .catch(() => {
        if (active) {
          setSigungus([])
        }
      })

    return () => {
      active = false
    }
  }, [selectedSido])

  useEffect(() => {
    setHierarchyDongs([])
    setSelectedDong('')
    setSelectedHierarchyRegion(null)
    if (!selectedSido || !selectedSigungu) {
      return
    }

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
        if (active) {
          setHierarchyDongs([])
        }
      })

    return () => {
      active = false
    }
  }, [selectedSido, selectedSigungu])

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
    setSelectedHierarchyRegion(null)
  }

  function handleRegionSelect(region: RegionItem) {
    setRegionQuery(region.dong || region.fullName)
    setSelectedRegionCode5(region.regionCode5)
    setSelectedHierarchyRegion(null)
    setRegionSuggestions([region])
  }

  function handleSidoChange(nextSido: string) {
    setSelectedSido(nextSido)
    setRegionQuery(nextSido)
    setSelectedRegionCode5('')
  }

  function handleSigunguChange(nextSigungu: string) {
    setSelectedSigungu(nextSigungu)
    setRegionQuery([selectedSido, nextSigungu].filter(Boolean).join(' '))
    setSelectedRegionCode5('')
  }

  function handleDongChange(nextDong: string) {
    setSelectedDong(nextDong)
    const matchingRegion = hierarchyDongs.find((region) => region.dong === nextDong) ?? null
    setSelectedHierarchyRegion(matchingRegion)
    setSelectedRegionCode5(matchingRegion?.regionCode5 ?? '')
    setRegionQuery(matchingRegion?.fullName ?? [selectedSido, selectedSigungu, nextDong].filter(Boolean).join(' '))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fallbackRegion = regionSuggestions[0]
    const selectedRegion = regionSuggestions.find((region) => region.regionCode5 === selectedRegionCode5)
    const effectiveRegion = selectedHierarchyRegion ?? selectedRegion ?? fallbackRegion
    const nextUrl = buildResultsUrl({
      q: regionQuery,
      sourceType,
      rentType,
      depositMax,
      monthlyRentMax,
      regionCode5: effectiveRegion?.regionCode5 || selectedRegionCode5 || fallbackRegion?.regionCode5 || '',
      dong: effectiveRegion?.dong || '',
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
