import { apiGet } from './client'

export type HousingType = 'apartment' | 'officetel'
export type RentType = 'all' | 'jeonse' | 'monthly' | 'sale'
export type TransactionSort = 'latest' | 'deposit_asc' | 'monthly_rent_asc'

export interface TransactionQueryParams {
  regionCode5: string
  dong?: string
  sourceType?: HousingType
  rentType?: RentType
  depositMax?: number
  monthlyRentMax?: number
  areaMin?: number
  areaMax?: number
  sort?: TransactionSort
  page?: number
  pageSize?: number
}

export interface TransactionItem {
  id: number
  sourceType: HousingType
  rentType: Exclude<RentType, 'all'>
  regionSido: string
  regionSigungu: string
  regionDong: string | null
  regionCode5: string
  buildingName: string
  addressJibun: string | null
  areaM2: string
  floor: number | null
  builtYear: number | null
  contractDate: string
  contractYearMonth: string
  depositAmountManwon: number
  monthlyRentManwon: number
}

export interface TransactionListResponse {
  items: TransactionItem[]
  page: number
  pageSize: number
  total: number
}

export function getTransactions(params: TransactionQueryParams): Promise<TransactionListResponse> {
  return apiGet<TransactionListResponse>('/api/transactions', params)
}
