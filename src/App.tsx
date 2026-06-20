import { useMemo, useState } from 'react'
import { AddressSearch } from './components/AddressSearch'
import { MapView } from './components/MapView'
import { NeighborhoodSummary } from './components/NeighborhoodSummary'
import { NearestResults } from './components/NearestResults'
import { RouteDetail } from './components/RouteDetail'
import { RouteList } from './components/RouteList'
import { routes } from './data/routes'
import { findNearest } from './lib/distance'
import { geocodeAddress, type GeocodeResult } from './lib/geocode'
import {
  clearRecentSearches,
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
  type SavedSearch,
} from './lib/searchStorage'
import type { NearestResult } from './types/route'
import './App.css'

function App() {
  const [visibleRouteIds, setVisibleRouteIds] = useState<number[]>(() => [routes[0].id])
  const [detailRouteId, setDetailRouteId] = useState<number>(routes[0].id)
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null)

  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<GeocodeResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null)
  const [nearestResults, setNearestResults] = useState<NearestResult[]>([])
  const [recentSearches, setRecentSearches] = useState<SavedSearch[]>(() =>
    loadRecentSearches(),
  )

  const detailRoute = useMemo(
    () => routes.find((route) => route.id === detailRouteId) ?? routes[0],
    [detailRouteId],
  )

  const totalStops = routes.reduce((sum, route) => sum + route.stops.length, 0)

  function toggleRoute(routeId: number) {
    // 정류장 포커스를 풀어야 지도가 표시 노선 전체에 맞게 다시 잡힌다
    setFocusedStopId(null)
    if (visibleRouteIds.includes(routeId)) {
      const next = visibleRouteIds.filter((id) => id !== routeId)
      setVisibleRouteIds(next)
      // 끄는 노선이 상세였다면 남은 표시 노선으로 상세를 옮긴다
      if (detailRouteId === routeId && next.length > 0) setDetailRouteId(next[0])
    } else {
      setVisibleRouteIds((prev) => [...prev, routeId])
      setDetailRouteId(routeId)
    }
  }

  function showAllRoutes() {
    setFocusedStopId(null)
    setVisibleRouteIds(routes.map((route) => route.id))
  }

  function hideAllRoutes() {
    setFocusedStopId(null)
    setVisibleRouteIds([])
  }

  function ensureRoutesVisible(routeIds: number[]) {
    setVisibleRouteIds((prev) => {
      const next = new Set(prev)
      routeIds.forEach((id) => next.add(id))
      return [...next]
    })
  }

  function applyLocation(location: GeocodeResult, query: string) {
    setSelectedLocation(location)
    setFocusedStopId(null)
    const results = findNearest(location.lat, location.lng, routes)
    setNearestResults(results)
    ensureRoutesVisible(results.map((result) => result.route.id))

    const trimmed = query.trim()
    if (trimmed) {
      setRecentSearches(
        saveRecentSearch({
          query: trimmed,
          label: location.label,
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          savedAt: Date.now(),
        }),
      )
    }
  }

  async function handleSearch() {
    const query = address.trim()
    if (!query) return

    setGeocoding(true)
    setGeocodeError(null)
    setCandidates([])
    setSelectedLocation(null)
    setNearestResults([])
    setFocusedStopId(null)

    try {
      const results = await geocodeAddress(query)
      if (results.length === 0) {
        setGeocodeError('검색 결과가 없습니다. 주소나 장소명을 다시 확인해 주세요.')
        return
      }
      setCandidates(results)
      applyLocation(results[0], query)
    } catch (error) {
      setGeocodeError(
        error instanceof Error ? error.message : '주소 검색 중 오류가 발생했습니다.',
      )
    } finally {
      setGeocoding(false)
    }
  }

  function handleReset() {
    setAddress('')
    setGeocodeError(null)
    setCandidates([])
    setSelectedLocation(null)
    setNearestResults([])
    setFocusedStopId(null)
  }

  function focusStop(result: NearestResult) {
    setFocusedStopId(result.stop.id)
    ensureRoutesVisible([result.route.id])
  }

  function runSavedSearch(saved: SavedSearch) {
    // 저장된 좌표로 바로 계산 — 지오코딩 API를 다시 거치지 않는다
    setAddress(saved.query)
    setGeocodeError(null)
    setCandidates([])
    applyLocation(
      { lat: saved.lat, lng: saved.lng, label: saved.label, address: saved.address },
      saved.query,
    )
  }

  function removeRecent(saved: SavedSearch) {
    setRecentSearches(removeRecentSearch(saved.query))
  }

  function clearRecent() {
    clearRecentSearches()
    setRecentSearches([])
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">원주 통근버스</p>
          <h1>노선 확인과 거리 분석</h1>
          <p className="header-copy">
            반곡동 혁신도시로 향하는 9개 통근버스 노선을 지도에서 비교하고, 집을 구할 때
            어느 동네가 탑승하기 편한지 빠르게 확인합니다.
          </p>
        </div>
        <dl className="stats">
          <div>
            <dt>노선</dt>
            <dd>{routes.length}</dd>
          </div>
          <div>
            <dt>정류장</dt>
            <dd>{totalStops}</dd>
          </div>
          <div>
            <dt>표시 중</dt>
            <dd>{visibleRouteIds.length}</dd>
          </div>
        </dl>
      </header>

      <section className="map-layout" aria-label="지도 분석">
        <div className="control-column">
          <AddressSearch
            address={address}
            candidates={candidates}
            error={geocodeError}
            geocoding={geocoding}
            onAddressChange={setAddress}
            onClearRecent={clearRecent}
            onRemoveRecent={removeRecent}
            onReset={handleReset}
            onRunRecent={runSavedSearch}
            onSearch={handleSearch}
            onSelectCandidate={(candidate) => applyLocation(candidate, address)}
            recentSearches={recentSearches}
            selectedLocation={selectedLocation}
          />
          <section className="panel" aria-labelledby="nearest-title">
            <div className="section-heading">
              <p className="eyebrow">Top 3</p>
              <h2 id="nearest-title">가까운 정류장 결과</h2>
            </div>
            <NearestResults
              focusedStopId={focusedStopId}
              hasUserLocation={selectedLocation !== null}
              onSelectStop={focusStop}
              results={nearestResults}
            />
          </section>
          <RouteList
            detailRouteId={detailRouteId}
            onHideAll={hideAllRoutes}
            onShowAll={showAllRoutes}
            onToggleRoute={toggleRoute}
            routes={routes}
            visibleRouteIds={visibleRouteIds}
          />
        </div>

        <div className="map-column">
          <MapView
            focusedStopId={focusedStopId}
            nearestResults={nearestResults}
            routes={routes}
            userLocation={selectedLocation}
            visibleRouteIds={visibleRouteIds}
          />
        </div>
      </section>

      <section className="analysis-grid secondary-grid" aria-label="동네 추천 및 노선 상세">
        <NeighborhoodSummary />
        <RouteDetail route={detailRoute} />
      </section>
    </main>
  )
}

export default App
