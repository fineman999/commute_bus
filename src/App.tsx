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
import type { Direction, NearestResult } from './types/route'
import './App.css'

const firstRouteId = (dir: Direction) =>
  routes.find((route) => route.direction === dir)?.id ?? routes[0].id

function App() {
  const [direction, setDirection] = useState<Direction>('출근')
  const [visibleRouteIds, setVisibleRouteIds] = useState<number[]>(() => [firstRouteId('출근')])
  const [detailRouteId, setDetailRouteId] = useState<number>(() => firstRouteId('출근'))
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null)

  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<GeocodeResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null)
  const [nearestResults, setNearestResults] = useState<NearestResult[]>([])
  const [recentSearches, setRecentSearches] = useState<SavedSearch[]>(() => loadRecentSearches())

  const directionRoutes = useMemo(
    () => routes.filter((route) => route.direction === direction),
    [direction],
  )

  const detailRoute = useMemo(
    () => directionRoutes.find((route) => route.id === detailRouteId) ?? directionRoutes[0],
    [directionRoutes, detailRouteId],
  )

  const directionStops = directionRoutes.reduce((sum, route) => sum + route.stops.length, 0)

  function changeDirection(next: Direction) {
    if (next === direction) return
    setDirection(next)
    setFocusedStopId(null)
    const dRoutes = routes.filter((route) => route.direction === next)
    const firstId = dRoutes[0].id
    setDetailRouteId(firstId)
    if (selectedLocation) {
      const results = findNearest(selectedLocation.lat, selectedLocation.lng, dRoutes)
      setNearestResults(results)
      setVisibleRouteIds([...new Set([firstId, ...results.map((result) => result.route.id)])])
    } else {
      setNearestResults([])
      setVisibleRouteIds([firstId])
    }
  }

  function toggleRoute(routeId: number) {
    setFocusedStopId(null)
    if (visibleRouteIds.includes(routeId)) {
      const next = visibleRouteIds.filter((id) => id !== routeId)
      setVisibleRouteIds(next)
      if (detailRouteId === routeId && next.length > 0) setDetailRouteId(next[0])
    } else {
      setVisibleRouteIds((prev) => [...prev, routeId])
      setDetailRouteId(routeId)
    }
  }

  function showAllRoutes() {
    setFocusedStopId(null)
    setVisibleRouteIds(directionRoutes.map((route) => route.id))
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
    const results = findNearest(location.lat, location.lng, directionRoutes)
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
            건강보험심사평가원 출퇴근 통근버스 노선을 지도에서 비교하고, 집을 구할 때 어느
            동네가 타기 편한지 빠르게 확인합니다.
          </p>
        </div>
        <dl className="stats">
          <div>
            <dt>{direction} 노선</dt>
            <dd>{directionRoutes.length}</dd>
          </div>
          <div>
            <dt>정류장</dt>
            <dd>{directionStops}</dd>
          </div>
          <div>
            <dt>표시 중</dt>
            <dd>{visibleRouteIds.length}</dd>
          </div>
        </dl>
      </header>

      <section className="map-layout" aria-label="지도 분석">
        <div className="control-column">
          <div className="direction-toggle" role="group" aria-label="출퇴근 방향 선택">
            <button
              aria-pressed={direction === '출근'}
              className={direction === '출근' ? 'active' : ''}
              onClick={() => changeDirection('출근')}
              type="button"
            >
              출근 <span>2사옥 도착</span>
            </button>
            <button
              aria-pressed={direction === '퇴근'}
              className={direction === '퇴근' ? 'active' : ''}
              onClick={() => changeDirection('퇴근')}
              type="button"
            >
              퇴근 <span>1사옥 출발</span>
            </button>
          </div>

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
              <h2 id="nearest-title">가까운 {direction} 정류장</h2>
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
            routes={directionRoutes}
            visibleRouteIds={visibleRouteIds}
          />
        </div>

        <div className="map-column">
          <MapView
            focusedStopId={focusedStopId}
            nearestResults={nearestResults}
            routes={directionRoutes}
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
