interface AddressSearchProps {
  latitude: string
  longitude: string
  onLatitudeChange: (value: string) => void
  onLongitudeChange: (value: string) => void
  onAnalyze: () => void
  onReset: () => void
}

export function AddressSearch({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  onAnalyze,
  onReset,
}: AddressSearchProps) {
  return (
    <section className="panel" aria-labelledby="address-title">
      <div className="section-heading">
        <p className="eyebrow">거리 분석</p>
        <h2 id="address-title">주소 검색 준비 단계</h2>
      </div>
      <p className="muted">
        Phase 3에서 카카오 주소 검색을 연결하기 전까지는 좌표 직접 입력으로 계산 흐름만
        검증합니다.
      </p>
      <div className="coordinate-form">
        <label>
          위도
          <input
            inputMode="decimal"
            onChange={(event) => onLatitudeChange(event.target.value)}
            placeholder="예: 37.3422"
            value={latitude}
          />
        </label>
        <label>
          경도
          <input
            inputMode="decimal"
            onChange={(event) => onLongitudeChange(event.target.value)}
            placeholder="예: 127.9202"
            value={longitude}
          />
        </label>
      </div>
      <div className="action-row">
        <button className="primary-button" onClick={onAnalyze} type="button">
          가까운 정류장 계산
        </button>
        <button className="secondary-button" onClick={onReset} type="button">
          초기화
        </button>
      </div>
    </section>
  )
}
