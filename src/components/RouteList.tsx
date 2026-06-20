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
    <section className="panel route-list" aria-labelledby="route-list-title">
      <div className="section-heading route-list-heading">
        <div>
          <p className="eyebrow">노선 선택</p>
          <h2 id="route-list-title">지도에 표시할 노선</h2>
        </div>
        <div className="route-toggle-actions">
          <button onClick={onShowAll} type="button">
            전체
          </button>
          <button onClick={onHideAll} type="button">
            해제
          </button>
        </div>
      </div>
      <div className="route-card-list">
        {routes.map((route) => {
          const visible = visibleRouteIds.includes(route.id)
          const active = route.id === detailRouteId
          return (
            <button
              aria-pressed={visible}
              className={`route-card ${visible ? 'selected' : ''} ${active ? 'active' : ''}`}
              key={route.id}
              onClick={() => onToggleRoute(route.id)}
              style={{ '--route-color': route.color } as CSSProperties}
              type="button"
            >
              <span className="route-card-head">
                <span className={`route-check ${visible ? 'on' : ''}`} aria-hidden="true" />
                <span className="route-card-title">{route.name}</span>
                <span className="route-card-meta">{route.stops.length} 정류장</span>
              </span>
              <span className="route-card-description">{route.description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
