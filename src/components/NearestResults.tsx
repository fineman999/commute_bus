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
              className={`grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-brand bg-brand-soft ring-1 ring-inset ring-brand'
                  : 'border-border bg-muted hover:border-brand-soft-border hover:bg-hover'
              }`}
              onClick={() => onSelectStop(result)}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-md bg-brand text-[13px] font-extrabold text-brand-fg">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <strong className="text-heading">{result.stop.name}</strong>
                  <span className="text-[15px] font-extrabold text-brand">
                    {result.distanceKm.toFixed(2)}km
                  </span>
                </span>
                <span className="block text-[13px] leading-relaxed text-subtle">
                  {result.route.name} · {result.stop.dong}
                  {result.stop.time ? ` · 출발 ${result.stop.time}` : ''} · 직선거리
                </span>
                <span className="mt-2 inline-flex text-[13px] font-extrabold text-brand">
                  지도에서 보기
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
