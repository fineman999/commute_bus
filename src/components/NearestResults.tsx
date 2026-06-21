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
      <div className="empty-state m-4">
        주소나 장소명을 검색하면 가장 가까운 정류장 Top 3를 계산합니다.
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="empty-state m-4">
        검색 위치 근처에 좌표가 등록된 정류장이 없습니다.
      </div>
    )
  }

  return (
    <ol className="m-0 grid list-none gap-2.5 p-4">
      {results.map((result, index) => {
        const active = result.stop.id === focusedStopId
        return (
          <li key={`${result.route.id}-${result.stop.id}`}>
            <button
              className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                active
                  ? 'border-brand bg-brand-soft'
                  : 'border-border bg-muted hover:border-brand-soft-border hover:bg-hover'
              }`}
              onClick={() => onSelectStop(result)}
              type="button"
            >
              <span className="min-w-[46px] rounded-md bg-brand-soft px-[7px] py-1 text-center text-[12px] font-extrabold text-brand-soft-fg">
                {index + 1}
              </span>
              <span className="min-w-0">
                <strong className="block text-heading">{result.stop.name}</strong>
                <span className="block text-[13px] text-subtle">
                  {result.route.name} · {result.stop.dong}
                  {result.stop.time ? ` · 출발 ${result.stop.time}` : ''} · 직선거리{' '}
                  {result.distanceKm.toFixed(2)}km
                </span>
              </span>
              <span className="whitespace-nowrap text-[13px] font-extrabold text-brand">
                지도 ›
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
