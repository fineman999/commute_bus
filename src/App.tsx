import { useMemo, useRef, useState } from 'react'
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
import { useTheme } from './lib/useTheme'

const firstRouteId = (dir: Direction) =>
  routes.find((route) => route.direction === dir)?.id ?? routes[0].id

function App() {
  const { theme, toggleTheme } = useTheme()
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

  // 비동기 지오코딩의 경쟁 상태 방지: 검색을 새로 시작/취소할 때마다 토큰을 올리고,
  // 응답이 돌아왔을 때 토큰이 바뀌었으면(더 최신 검색이 시작됨) 결과를 버린다.
  const searchSeq = useRef(0)

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

    const seq = ++searchSeq.current
    setGeocoding(true)
    setGeocodeError(null)
    setCandidates([])
    setSelectedLocation(null)
    setNearestResults([])
    setFocusedStopId(null)

    try {
      const results = await geocodeAddress(query)
      if (seq !== searchSeq.current) return // 더 최신 검색/초기화가 시작됨 → 무시
      if (results.length === 0) {
        setGeocodeError('검색 결과가 없습니다. 주소나 장소명을 다시 확인해 주세요.')
        return
      }
      setCandidates(results)
      applyLocation(results[0], query)
    } catch (error) {
      if (seq !== searchSeq.current) return
      setGeocodeError(
        error instanceof Error ? error.message : '주소 검색 중 오류가 발생했습니다.',
      )
    } finally {
      if (seq === searchSeq.current) setGeocoding(false)
    }
  }

  function handleReset() {
    searchSeq.current++ // 진행 중인 검색 응답이 초기화 상태를 덮어쓰지 못하게 무효화
    setAddress('')
    setGeocoding(false)
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
    searchSeq.current++ // 진행 중인 검색 응답이 저장된 검색 결과를 덮어쓰지 못하게 무효화
    setAddress(saved.query)
    setGeocoding(false)
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
    <main className="mx-auto w-[calc(100%-24px)] pb-14 pt-7 min-[900px]:w-[min(1180px,calc(100%-32px))] min-[900px]:pt-10">
      <header className="mb-7 grid grid-cols-1 items-end gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="eyebrow">원주 통근버스</p>
          <h1 className="mb-3 max-w-[680px] text-[34px] font-bold leading-[1.12] text-heading min-[900px]:text-[44px]">
            노선 확인과 거리 분석
          </h1>
          <p className="mb-0 max-w-[720px] text-[17px] text-fg">
            건강보험심사평가원 출퇴근 통근버스 노선을 지도에서 비교하고, 집을 구할 때 어느
            동네가 타기 편한지 빠르게 확인합니다.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 min-[900px]:items-end">
          <button
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-bold text-fg transition-colors hover:border-brand-soft-border"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? '☀️ 라이트' : '🌙 다크'}
          </button>
          <dl className="m-0 grid w-full grid-cols-1 gap-2.5 min-[560px]:grid-cols-3">
            <div className="min-w-[86px] rounded-lg border border-border-strong bg-surface px-4 py-3.5">
              <dt className="text-[13px] text-subtle">{direction} 노선</dt>
              <dd className="mt-0.5 text-[26px] font-extrabold text-heading">
                {directionRoutes.length}
              </dd>
            </div>
            <div className="min-w-[86px] rounded-lg border border-border-strong bg-surface px-4 py-3.5">
              <dt className="text-[13px] text-subtle">정류장</dt>
              <dd className="mt-0.5 text-[26px] font-extrabold text-heading">{directionStops}</dd>
            </div>
            <div className="min-w-[86px] rounded-lg border border-border-strong bg-surface px-4 py-3.5">
              <dt className="text-[13px] text-subtle">표시 중</dt>
              <dd className="mt-0.5 text-[26px] font-extrabold text-heading">
                {visibleRouteIds.length}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div
        className="mb-5 grid max-w-[440px] grid-cols-2 gap-2 rounded-[10px] border border-border-strong bg-surface p-1.5 shadow-card"
        role="group"
        aria-label="출퇴근 방향 선택"
      >
        <DirectionButton
          active={direction === '출근'}
          onClick={() => changeDirection('출근')}
          label="출근"
          sub="2사옥 도착"
        />
        <DirectionButton
          active={direction === '퇴근'}
          onClick={() => changeDirection('퇴근')}
          label="퇴근"
          sub="1사옥 출발"
        />
      </div>

      <section className="grid grid-cols-1 gap-5" aria-label="지도 분석">
        <div className="min-w-0">
          <MapView
            focusedStopId={focusedStopId}
            nearestResults={nearestResults}
            routes={directionRoutes}
            userLocation={selectedLocation}
            visibleRouteIds={visibleRouteIds}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 min-[820px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
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
            <div className="section-heading px-4 pt-3.5 pb-3">
              <p className="eyebrow">Top 3</p>
              <h2 id="nearest-title" className="text-[18px] font-bold leading-tight text-heading">
                가까운 {direction} 정류장
              </h2>
            </div>
            <div aria-live="polite">
              <NearestResults
                focusedStopId={focusedStopId}
                hasUserLocation={selectedLocation !== null}
                onSelectStop={focusStop}
                results={nearestResults}
              />
            </div>
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
      </section>

      <section
        className="mt-5 grid grid-cols-1 items-start gap-5 min-[900px]:grid-cols-[minmax(300px,0.92fr)_minmax(0,1.08fr)]"
        aria-label="동네 추천 및 노선 상세"
      >
        <NeighborhoodSummary />
        <RouteDetail route={detailRoute} />
      </section>
    </main>
  )
}

interface DirectionButtonProps {
  active: boolean
  onClick: () => void
  label: string
  sub: string
}

function DirectionButton({ active, onClick, label, sub }: DirectionButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={`grid gap-0.5 rounded-lg border px-3 py-2.5 text-[15px] font-extrabold transition-colors ${
        active
          ? 'border-brand-strong bg-brand text-brand-fg'
          : 'border-transparent bg-muted text-fg'
      }`}
      onClick={onClick}
      type="button"
    >
      {label} <span className={`text-[11px] font-bold ${active ? 'text-blue-100' : 'text-subtle'}`}>{sub}</span>
    </button>
  )
}

export default App
