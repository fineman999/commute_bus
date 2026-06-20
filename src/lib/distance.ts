import type { BusRoute, NearestResult } from '../types/route'

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function findNearest(
  userLat: number,
  userLng: number,
  busRoutes: BusRoute[],
  topN = 3,
): NearestResult[] {
  return busRoutes
    .flatMap((route) =>
      route.stops
        .filter((stop) => stop.lat !== undefined && stop.lng !== undefined)
        .map((stop) => ({
          stop,
          route,
          distanceKm: haversineKm(userLat, userLng, stop.lat!, stop.lng!),
        })),
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, topN)
}
