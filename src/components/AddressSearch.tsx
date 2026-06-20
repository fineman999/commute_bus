import { useRef, type PointerEvent } from 'react'
import type { GeocodeResult } from '../lib/geocode'
import type { SavedSearch } from '../lib/searchStorage'

interface AddressSearchProps {
  address: string
  geocoding: boolean
  error: string | null
  candidates: GeocodeResult[]
  selectedLocation: GeocodeResult | null
  recentSearches: SavedSearch[]
  onAddressChange: (value: string) => void
  onSearch: () => void
  onSelectCandidate: (candidate: GeocodeResult) => void
  onRunRecent: (saved: SavedSearch) => void
  onRemoveRecent: (saved: SavedSearch) => void
  onClearRecent: () => void
  onReset: () => void
}

export function AddressSearch({
  address,
  geocoding,
  error,
  candidates,
  selectedLocation,
  recentSearches,
  onAddressChange,
  onSearch,
  onSelectCandidate,
  onRunRecent,
  onRemoveRecent,
  onClearRecent,
  onReset,
}: AddressSearchProps) {
  // 가로 드래그 스크롤(최근 검색 탭이 많을 때) + 드래그와 클릭 구분
  const tabsRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false })

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const el = tabsRef.current
    if (!el) return
    dragRef.current = { down: true, startX: event.clientX, scrollLeft: el.scrollLeft, moved: false }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = tabsRef.current
    if (!el || !dragRef.current.down) return
    const dx = event.clientX - dragRef.current.startX
    if (Math.abs(dx) > 4) dragRef.current.moved = true
    el.scrollLeft = dragRef.current.scrollLeft - dx
  }

  function handlePointerUp() {
    dragRef.current.down = false
  }

  function handleRunRecent(saved: SavedSearch) {
    // 드래그로 스크롤한 경우엔 검색 실행을 막는다
    if (dragRef.current.moved) return
    onRunRecent(saved)
  }
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

      {recentSearches.length > 0 && (
        <div className="recent-search">
          <div className="recent-search-head">
            <span className="recent-search-title">최근 검색 {recentSearches.length}</span>
            <button className="recent-clear" onClick={onClearRecent} type="button">
              전체 지우기
            </button>
          </div>
          <div
            className="recent-tabs"
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            ref={tabsRef}
          >
            {recentSearches.map((item) => (
              <div className="recent-tab" key={`${item.savedAt}-${item.lat}-${item.lng}`}>
                <button
                  className="recent-tab-run"
                  onClick={() => handleRunRecent(item)}
                  title={item.address}
                  type="button"
                >
                  {item.query}
                </button>
                <button
                  aria-label={`${item.query} 삭제`}
                  className="recent-tab-remove"
                  onClick={() => onRemoveRecent(item)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
