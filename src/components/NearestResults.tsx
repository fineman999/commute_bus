import type { NearestResult } from '../types/route'

interface NearestResultsProps {
  results: NearestResult[]
  hasUserLocation: boolean
  focusedStopId: string | null
  onSelectStop: (result: NearestResult) => void
}

export function NearestResults({
  results,
  hasUserLocation,
  focusedStopId,
  onSelectStop,
}: NearestResultsProps) {
  if (!hasUserLocation) {
    return (
      <div className="empty-state">
        주소나 장소명을 검색하면 가장 가까운 정류장 Top 3를 계산합니다.
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        검색 위치 근처에 좌표가 등록된 정류장이 없습니다.
      </div>
    )
  }

  return (
    <ol className="nearest-list">
      {results.map((result, index) => {
        const active = result.stop.id === focusedStopId
        return (
          <li key={`${result.route.id}-${result.stop.id}`}>
            <button
              className={`nearest-item ${active ? 'active' : ''}`}
              onClick={() => onSelectStop(result)}
              type="button"
            >
              <span className="nearest-rank">{index + 1}</span>
              <span className="nearest-body">
                <strong>{result.stop.name}</strong>
                <span>
                  {result.route.name} · {result.stop.dong}
                  {result.stop.time ? ` · 출발 ${result.stop.time}` : ''} · 직선거리{' '}
                  {result.distanceKm.toFixed(2)}km
                </span>
              </span>
              <span className="nearest-go">지도 ›</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
