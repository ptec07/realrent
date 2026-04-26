import { apiGet } from './client'
import type { HousingType, RentType } from './transactions'

export interface CompareQueryParams {
  regionA: string
  regionB: string
  sourceType?: HousingType
  rentType?: RentType
  months?: number
}

export interface CompareRegionSummary {
  regionCode5: string
  transactionCount: number
  avgDepositManwon?: number | null
  avgMonthlyRentManwon?: number | null
  avgAreaM2?: string | null
  latestMonth?: string | null
  sampleWarning?: string | null
}

export interface CompareDiff {
  depositManwon: number | null
  monthlyRentManwon: number | null
}

export interface CompareResponse {
  regionA: CompareRegionSummary
  regionB: CompareRegionSummary
  diff: CompareDiff
  insight: string
}

export function getCompare(params: CompareQueryParams): Promise<CompareResponse> {
  return apiGet<CompareResponse>('/api/compare', params)
}
