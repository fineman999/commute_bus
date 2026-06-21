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
      <div className="grid gap-2.5 p-4">
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
              className={`grid w-full gap-1.5 rounded-lg border border-l-[6px] p-3 text-left transition-colors ${stateClasses}`}
              key={route.id}
              onClick={() => onToggleRoute(route.id)}
              style={{ borderLeftColor: route.color } as CSSProperties}
              type="button"
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`h-4 w-4 flex-none rounded-full border-2 ${
                    visible
                      ? 'shadow-[inset_0_0_0_2px_var(--surface)]'
                      : 'border-border-strong bg-surface'
                  }`}
                  style={
                    visible ? { backgroundColor: route.color, borderColor: route.color } : undefined
                  }
                />
                <span className="text-[16px] font-extrabold text-heading">{route.name}</span>
                <span className="ml-auto text-[13px] text-subtle">
                  {route.stops.length} 정류장
                </span>
              </span>
              <span className="text-[14px] text-fg">{route.description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
