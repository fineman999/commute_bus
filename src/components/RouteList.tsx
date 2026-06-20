import type { BusRoute } from '../types/route'

interface RouteListProps {
  routes: BusRoute[]
  selectedRouteId: number
  onSelectRoute: (routeId: number) => void
}

export function RouteList({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RouteListProps) {
  return (
    <section className="panel route-list" aria-labelledby="route-list-title">
      <div className="section-heading">
        <p className="eyebrow">노선 목록</p>
        <h2 id="route-list-title">9개 통근버스 노선</h2>
      </div>
      <div className="route-card-list">
        {routes.map((route) => {
          const selected = route.id === selectedRouteId

          return (
            <button
              className={`route-card ${selected ? 'selected' : ''}`}
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              style={{ '--route-color': route.color } as React.CSSProperties}
              type="button"
            >
              <span className="route-card-title">{route.name}</span>
              <span className="route-card-meta">{route.stops.length}개 정류장</span>
              <span className="route-card-description">{route.description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
