import { neighborhoodRecommendations } from '../data/routes'

export function NeighborhoodSummary() {
  return (
    <section className="panel" aria-labelledby="neighborhood-title">
      <div className="section-heading">
        <p className="eyebrow">동네별 추천</p>
        <h2 id="neighborhood-title" className="text-[22px] font-bold leading-tight text-heading">
          집 구할 때 먼저 볼 구역
        </h2>
        <p className="mt-2 text-[13px] text-subtle">
          거주지 기준 추천이라 출근·퇴근 방향과 무관합니다.
        </p>
      </div>
      <div className="grid gap-3 px-[22px] py-[22px] min-[560px]:grid-cols-2 min-[900px]:grid-cols-1">
        {neighborhoodRecommendations.map((item) => (
          <article
            className="rounded-lg border border-border bg-muted p-4 transition-colors hover:border-brand-soft-border"
            key={item.dong}
          >
            <div>
              <h3 className="mb-1 text-[17px] font-bold text-heading">{item.dong}</h3>
              <strong className="text-brand">{item.route}</strong>
            </div>
            <p className="mb-0 mt-1 text-fg">{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
