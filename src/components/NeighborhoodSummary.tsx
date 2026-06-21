import { neighborhoodRecommendations } from '../data/routes'

export function NeighborhoodSummary() {
  return (
    <section className="panel" aria-labelledby="neighborhood-title">
      <div className="section-heading">
        <p className="eyebrow">동네별 추천</p>
        <h2 id="neighborhood-title">집 구할 때 먼저 볼 구역</h2>
        <p className="section-note">거주지 기준 추천이라 출근·퇴근 방향과 무관합니다.</p>
      </div>
      <div className="summary-grid">
        {neighborhoodRecommendations.map((item) => (
          <article className="summary-card" key={item.dong}>
            <div>
              <h3>{item.dong}</h3>
              <strong>{item.route}</strong>
            </div>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
