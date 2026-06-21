import type { CSSProperties } from 'react'
import type { BusRoute } from '../types/route'

interface RouteListProps {
  routes: BusRoute[]
  visibleRouteIds: number[]
  detailRouteId: number
  onToggleRoute: (routeId: number) => void
  onShowAll: () => void
  onHideAll: () => void
}

export function RouteList({
  routes,
  visibleRouteIds,
  detailRouteId,
  onToggleRoute,
  onShowAll,
  onHideAll,
}: RouteListProps) {
  return (
    <section className="panel" aria-labelledby="route-list-title">
      <div className="section-heading flex items-end justify-between gap-3 px-4 pt-3.5 pb-3">
        <div>
          <p className="eyebrow">노선 선택</p>
          <h2 id="route-list-title" className="text-[18px] font-bold leading-tight text-heading">
            지도에 표시할 노선
          </h2>
        </div>
        <div className="flex gap-1.5">
          <button
            className="rounded-md border border-border-strong bg-surface px-[11px] py-1.5 text-[12px] font-bold text-fg transition-colors hover:border-brand-soft-border"
            onClick={onShowAll}
            type="button"
          >
            전체
          </button>
          <button
            className="rounded-md border border-border-strong bg-surface px-[11px] py-1.5 text-[12px] font-bold text-fg transition-colors hover:border-brand-soft-border"
            onClick={onHideAll}
            type="button"
          >
            해제
          </button>
        </div>
      </div>
      <div className="grid max-h-[520px] gap-2.5 overflow-y-auto p-4 [scrollbar-width:thin] min-[1120px]:max-h-[360px]">
        {routes.map((route) => {
          const visible = visibleRouteIds.includes(route.id)
          const active = route.id === detailRouteId
          const stateClasses = active
            ? 'border-brand bg-brand-soft ring-1 ring-inset ring-brand'
            : visible
              ? 'border-brand-soft-border bg-brand-soft'
              : 'border-border bg-surface hover:border-brand-soft-border'
          return (
            <button
              aria-pressed={visible}
              className={`grid w-full gap-2 rounded-lg border border-l-[6px] p-3 text-left transition-colors ${stateClasses}`}
              key={route.id}
              onClick={() => onToggleRoute(route.id)}
              style={{ borderLeftColor: route.color } as CSSProperties}
              type="button"
            >
              <span className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 h-4 w-4 flex-none rounded-full border-2 ${
                    visible
                      ? 'shadow-[inset_0_0_0_2px_var(--surface)]'
                      : 'border-border-strong bg-surface'
                  }`}
                  style={
                    visible ? { backgroundColor: route.color, borderColor: route.color } : undefined
                  }
                />
                <span className="min-w-0">
                  <span className="block text-[15px] font-extrabold leading-tight text-heading">
                    {route.name}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-fg">
                    {route.description}
                  </span>
                </span>
                <span className="ml-auto flex-none whitespace-nowrap rounded-full bg-muted px-2 py-1 text-[12px] font-bold text-subtle">
                  {route.stops.length}개
                </span>
              </span>
              {active && (
                <span className="ml-[26px] text-[12px] font-extrabold text-brand">
                  상세 표시 중
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
