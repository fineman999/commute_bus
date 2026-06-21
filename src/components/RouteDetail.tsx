import type { BusRoute } from '../types/route'

interface RouteDetailProps {
  route: BusRoute
}

export function RouteDetail({ route }: RouteDetailProps) {
  const dongs = Array.from(new Set(route.stops.map((stop) => stop.dong)))

  return (
    <section className="panel min-h-full" aria-labelledby="route-detail-title">
      <div className="section-heading">
        <p className="eyebrow">선택 노선</p>
        <h2 id="route-detail-title" className="text-[22px] font-bold leading-tight text-heading">
          {route.name}
        </h2>
      </div>
      <p className="px-[22px] pt-5 text-fg">{route.description}</p>
      <div className="flex flex-wrap gap-2 px-[22px] pt-4 pb-0.5" aria-label="경유 행정구역">
        {dongs.map((dong) => (
          <span className="chip" key={dong}>
            {dong}
          </span>
        ))}
      </div>
      <ol className="m-0 grid list-none gap-2.5 px-[22px] py-[22px]">
        {route.stops.map((stop, index) => {
          const badge = stop.time ?? (index === route.stops.length - 1 ? '도착' : '경유')
          return (
            <li
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-border bg-muted p-3"
              key={stop.id}
            >
              <span className="min-w-[46px] whitespace-nowrap rounded-md bg-brand-soft px-[7px] py-1 text-center text-[12px] font-extrabold text-brand-soft-fg">
                {badge}
              </span>
              <span>
                <strong className="block text-heading">{stop.name}</strong>
                <span className="block text-[14px] text-subtle">
                  {stop.code ? `${stop.dong} · ${stop.code}` : stop.dong}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
