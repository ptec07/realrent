import type { RegionItem } from '../../api/regions'

interface RegionHierarchySelectProps {
  sidos: string[]
  sigungus: string[]
  dongs: RegionItem[]
  selectedSido: string
  selectedSigungu: string
  selectedDong: string
  onSidoChange: (sido: string) => void
  onSigunguChange: (sigungu: string) => void
  onDongChange: (dong: string) => void
}

export default function RegionHierarchySelect({
  sidos,
  sigungus,
  dongs,
  selectedSido,
  selectedSigungu,
  selectedDong,
  onSidoChange,
  onSigunguChange,
  onDongChange,
}: RegionHierarchySelectProps) {
  return (
    <div className="region-hierarchy" aria-label="지역 단계 선택">
      <label className="field-group" htmlFor="sido-select">
        <span>특별시·광역시·도</span>
        <select id="sido-select" value={selectedSido} onChange={(event) => onSidoChange(event.target.value)}>
          <option value="">선택하세요</option>
          {sidos.map((sido) => (
            <option key={sido} value={sido}>
              {sido}
            </option>
          ))}
        </select>
      </label>

      <label className="field-group" htmlFor="sigungu-select">
        <span>시군구</span>
        <select
          id="sigungu-select"
          value={selectedSigungu}
          onChange={(event) => onSigunguChange(event.target.value)}
          disabled={!selectedSido}
        >
          <option value="">선택하세요</option>
          {sigungus.map((sigungu) => (
            <option key={sigungu} value={sigungu}>
              {sigungu}
            </option>
          ))}
        </select>
      </label>

      <label className="field-group" htmlFor="dong-select">
        <span>읍면동</span>
        <select
          id="dong-select"
          value={selectedDong}
          onChange={(event) => onDongChange(event.target.value)}
          disabled={!selectedSigungu}
        >
          <option value="">선택하세요</option>
          {dongs.map((region) => (
            <option key={`${region.regionCode5}-${region.dong ?? region.fullName}`} value={region.dong ?? ''}>
              {region.dong ?? region.fullName}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
