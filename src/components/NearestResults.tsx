import type { NearestResult } from '../types/route'

interface NearestResultsProps {
  results: NearestResult[]
  hasUserLocation: boolean
}

export function NearestResults({ results, hasUserLocation }: NearestResultsProps) {
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
        아직 정류장 좌표가 등록되지 않아 거리 분석 결과를 만들 수 없습니다. Phase 2에서
        검증된 좌표를 추가하면 이 영역에 가까운 정류장이 표시됩니다.
      </div>
    )
  }

  return (
    <ol className="nearest-list">
      {results.map((result) => (
        <li className="nearest-item" key={`${result.route.id}-${result.stop.id}`}>
          <span className="nearest-rank">{result.route.name}</span>
          <span>
            <strong>{result.stop.name}</strong>
            <span>
              {result.stop.dong} · 직선거리 {result.distanceKm.toFixed(2)}km
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
