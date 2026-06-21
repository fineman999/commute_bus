import type { BusRoute } from '../types/route'

interface RouteDetailProps {
  route: BusRoute
}

export function RouteDetail({ route }: RouteDetailProps) {
  const dongs = Array.from(new Set(route.stops.map((stop) => stop.dong)))

  return (
    <section className="panel route-detail" aria-labelledby="route-detail-title">
      <div className="section-heading">
        <p className="eyebrow">선택 노선</p>
        <h2 id="route-detail-title">{route.name}</h2>
      </div>
      <p className="detail-description">{route.description}</p>
      <div className="dong-chip-list" aria-label="경유 행정구역">
        {dongs.map((dong) => (
          <span className="dong-chip" key={dong}>
            {dong}
          </span>
        ))}
      </div>
      <ol className="stop-list">
        {route.stops.map((stop, index) => {
          const badge = stop.time ?? (index === route.stops.length - 1 ? '도착' : '경유')
          return (
            <li className="stop-item" key={stop.id}>
              <span className="stop-time">{badge}</span>
              <span>
                <strong>{stop.name}</strong>
                <span>{stop.code ? `${stop.dong} · ${stop.code}` : stop.dong}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
