import type { GeocodeResult } from '../lib/geocode'

interface AddressSearchProps {
  address: string
  geocoding: boolean
  error: string | null
  candidates: GeocodeResult[]
  selectedLocation: GeocodeResult | null
  onAddressChange: (value: string) => void
  onSearch: () => void
  onSelectCandidate: (candidate: GeocodeResult) => void
  onReset: () => void
}

export function AddressSearch({
  address,
  geocoding,
  error,
  candidates,
  selectedLocation,
  onAddressChange,
  onSearch,
  onSelectCandidate,
  onReset,
}: AddressSearchProps) {
  return (
    <section className="panel search-panel" aria-labelledby="address-title">
      <div className="section-heading">
        <p className="eyebrow">거리 분석</p>
        <h2 id="address-title">주소로 가까운 정류장 찾기</h2>
      </div>

      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch()
        }}
      >
        <input
          aria-label="주소 또는 장소명"
          className="search-input"
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="예: 원주시 무실동 / 단구초등학교"
          value={address}
        />
        <div className="search-actions">
          <button className="primary-button" disabled={geocoding} type="submit">
            {geocoding ? '검색 중…' : '검색'}
          </button>
          <button className="secondary-button" onClick={onReset} type="button">
            초기화
          </button>
        </div>
      </form>

      {error && (
        <p className="search-error" role="alert">
          {error}
        </p>
      )}

      {selectedLocation && (
        <div className="selected-location">
          <strong>{selectedLocation.label}</strong>
          <span>{selectedLocation.address}</span>
        </div>
      )}

      {candidates.length > 1 && (
        <div className="candidate-list">
          <p className="candidate-hint">
            검색 결과 {candidates.length}건 — 정확한 위치를 선택하세요.
          </p>
          {candidates.map((candidate, index) => {
            const selected =
              selectedLocation?.lat === candidate.lat &&
              selectedLocation?.lng === candidate.lng
            return (
              <button
                className={`candidate-item ${selected ? 'selected' : ''}`}
                key={`${candidate.lat}-${candidate.lng}-${index}`}
                onClick={() => onSelectCandidate(candidate)}
                type="button"
              >
                <strong>{candidate.label}</strong>
                <span>{candidate.address}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
