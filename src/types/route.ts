export interface Stop {
  id: string
  name: string
  dong: string
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
