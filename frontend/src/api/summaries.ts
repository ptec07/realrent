import { apiGet } from './client'
import type { HousingType, RentType } from './transactions'

export interface SummaryQueryParams {
  regionCode5: string
  sourceType?: HousingType
  rentType?: RentType
  months?: number
}

export interface SummaryResponse {
  regionCode5: string
  sourceType: HousingType | null
  rentType: RentType | null
  months: number
  transactionCount: number
  avgDepositManwon: number | null
  avgMonthlyRentManwon: number | null
  avgAreaM2: string | null
  latestMonth: string | null
  sampleWarning: string | null
}

export function getSummary(params: SummaryQueryParams): Promise<SummaryResponse> {
  return apiGet<SummaryResponse>('/api/summary', params)
}
