import { apiGet } from './client'
import type { HousingType, RentType } from './transactions'

export interface TrendsQueryParams {
  regionCode5: string
  sourceType?: HousingType
  rentType?: RentType
  months?: number
}

export interface TrendPoint {
  month: string
  transactionCount: number
  avgDepositManwon: number | null
  avgMonthlyRentManwon: number | null
  avgAreaM2: string | null
}

export interface TrendsResponse {
  regionCode5: string
  sourceType: HousingType | null
  rentType: RentType | null
  months: number
  points: TrendPoint[]
}

export function getTrends(params: TrendsQueryParams): Promise<TrendsResponse> {
  return apiGet<TrendsResponse>('/api/trends', params)
}
