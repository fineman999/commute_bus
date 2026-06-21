export interface Stop {
  id: string
  name: string
  dong: string
  code?: string // 정거장번호 (예: '63-019')
  time?: string // 출발 시각 (예: '8:00'), 종착지는 없음
  lat?: number
  lng?: number
}

export interface BusRoute {
  id: number
  name: string
  description: string
  stops: Stop[]
  color: string
}

export interface NearestResult {
  stop: Stop
  route: BusRoute
  distanceKm: number
}
