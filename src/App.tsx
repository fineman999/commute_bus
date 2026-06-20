import { useMemo, useState } from 'react'
import { AddressSearch } from './components/AddressSearch'
import { NeighborhoodSummary } from './components/NeighborhoodSummary'
import { NearestResults } from './components/NearestResults'
import { RouteDetail } from './components/RouteDetail'
import { RouteList } from './components/RouteList'
import { routes } from './data/routes'
import { findNearest } from './lib/distance'
import { geocodeAddress, type GeocodeResult } from './lib/geocode'
import type { NearestResult } from './types/route'
import './App.css'

function App() {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0].id)
  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<GeocodeResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null)
  const [nearestResults, setNearestResults] = useState<NearestResult[]>([])

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? routes[0],
    [selectedRouteId],
  )

  const totalStops = routes.reduce((sum, route) => sum + route.stops.length, 0)
  const stopsWithCoordinates = routes.reduce(
    (sum, route) =>
      sum +
      route.stops.filter((stop) => stop.lat !== undefined && stop.lng !== undefined).length,
    0,
  )

  function applyLocation(location: GeocodeResult) {
    setSelectedLocation(location)
    setNearestResults(findNearest(location.lat, location.lng, routes))
  }

  async function handleSearch() {
    const query = address.trim()
    if (!query) return

    setGeocoding(true)
    setGeocodeError(null)
    setCandidates([])
    setSelectedLocation(null)
    setNearestResults([])

    try {
      const results = await geocodeAddress(query)
      if (results.length === 0) {
        setGeocodeError('검색 결과가 없습니다. 주소나 장소명을 다시 확인해 주세요.')
        return
      }
      setCandidates(results)
      applyLocation(results[0])
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
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">원주 통근버스</p>
          <h1>노선 확인과 거리 분석</h1>
          <p className="header-copy">
            반곡동 혁신도시로 향하는 9개 통근버스 노선을 비교하고, 집을 구할 때
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
            <dt>좌표 등록</dt>
            <dd>{stopsWithCoordinates}</dd>
          </div>
        </dl>
      </header>

      <section className="analysis-grid" aria-label="노선 분석">
        <RouteList
          onSelectRoute={setSelectedRouteId}
          routes={routes}
          selectedRouteId={selectedRouteId}
        />
        <RouteDetail route={selectedRoute} />
      </section>

      <section className="analysis-grid secondary-grid" aria-label="추천 및 거리 분석">
        <NeighborhoodSummary />
        <div className="stack">
          <AddressSearch
            address={address}
            candidates={candidates}
            error={geocodeError}
            geocoding={geocoding}
            onAddressChange={setAddress}
            onReset={handleReset}
            onSearch={handleSearch}
            onSelectCandidate={applyLocation}
            selectedLocation={selectedLocation}
          />
          <section className="panel" aria-labelledby="nearest-title">
            <div className="section-heading">
              <p className="eyebrow">Top 3</p>
              <h2 id="nearest-title">가까운 정류장 결과</h2>
            </div>
            <NearestResults
              hasUserLocation={selectedLocation !== null}
              results={nearestResults}
            />
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
