import { useMemo, useState } from 'react'
import { AddressSearch } from './components/AddressSearch'
import { NeighborhoodSummary } from './components/NeighborhoodSummary'
import { NearestResults } from './components/NearestResults'
import { RouteDetail } from './components/RouteDetail'
import { RouteList } from './components/RouteList'
import { routes } from './data/routes'
import { findNearest } from './lib/distance'
import type { NearestResult } from './types/route'
import './App.css'

function App() {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0].id)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [nearestResults, setNearestResults] = useState<NearestResult[]>([])
  const [hasUserLocation, setHasUserLocation] = useState(false)

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

  function handleAnalyze() {
    const lat = Number(latitude)
    const lng = Number(longitude)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setHasUserLocation(false)
      setNearestResults([])
      return
    }

    setHasUserLocation(true)
    setNearestResults(findNearest(lat, lng, routes))
  }

  function handleReset() {
    setLatitude('')
    setLongitude('')
    setHasUserLocation(false)
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
            latitude={latitude}
            longitude={longitude}
            onAnalyze={handleAnalyze}
            onLatitudeChange={setLatitude}
            onLongitudeChange={setLongitude}
            onReset={handleReset}
          />
          <section className="panel" aria-labelledby="nearest-title">
            <div className="section-heading">
              <p className="eyebrow">Top 3</p>
              <h2 id="nearest-title">가까운 정류장 결과</h2>
            </div>
            <NearestResults hasUserLocation={hasUserLocation} results={nearestResults} />
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
