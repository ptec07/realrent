import { apiGet } from './client'

export interface RegionItem {
  fullName: string
  sido: string
  sigungu: string
  dong: string | null
  regionCode5: string
}

export interface RegionSearchResponse {
  items: RegionItem[]
}

export interface RegionHierarchyResponse {
  sidos: string[]
  sigungus: string[]
  dongs: RegionItem[]
}

export function searchRegions(q: string): Promise<RegionSearchResponse> {
  return apiGet<RegionSearchResponse>('/api/regions', { q })
}

export function listRegionHierarchy(params: { sido?: string; sigungu?: string } = {}): Promise<RegionHierarchyResponse> {
  return apiGet<RegionHierarchyResponse>('/api/regions/hierarchy', params)
}
