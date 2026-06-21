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
    <section className="panel pb-5" aria-labelledby="address-title">
      <div className="section-heading px-4 pt-3.5 pb-3">
        <p className="eyebrow">거리 분석</p>
        <h2 id="address-title" className="text-[18px] font-bold leading-tight text-heading">
          주소로 가까운 정류장 찾기
        </h2>
      </div>

      <form
        className="grid gap-3 px-4 pt-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSearch()
        }}
      >
        <input
          aria-label="주소 또는 장소명"
          className="field"
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="예: 원주시 무실동 / 단구초등학교"
          value={address}
        />
        <div className="flex flex-wrap gap-2.5">
          <button className="btn-primary" disabled={geocoding} type="submit">
            {geocoding ? '검색 중…' : '검색'}
          </button>
          <button className="btn-secondary" onClick={onReset} type="button">
            초기화
          </button>
        </div>
      </form>

      {error && (
        <p
          className="mx-4 mt-3.5 rounded-lg border border-danger-border bg-danger-bg px-3.5 py-3 font-bold text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {selectedLocation && (
        <div className="mx-4 mt-4 grid gap-1 rounded-lg border border-brand-soft-border bg-brand-soft px-4 py-3.5">
          <strong className="text-brand-soft-fg">{selectedLocation.label}</strong>
          <span className="text-[14px] text-fg">{selectedLocation.address}</span>
        </div>
      )}

      {candidates.length > 1 && (
        <div className="grid gap-2 px-4 pt-3.5">
          <p className="m-0 text-[13px] font-bold text-fg">
            검색 결과 {candidates.length}건 — 정확한 위치를 선택하세요.
          </p>
          <div className="grid max-h-[230px] gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {candidates.map((candidate, index) => {
              const selected =
                selectedLocation?.lat === candidate.lat &&
                selectedLocation?.lng === candidate.lng
              return (
                <button
                  className={`grid gap-[3px] rounded-lg border px-[13px] py-[11px] text-left transition-colors ${
                    selected
                      ? 'border-brand bg-brand-soft'
                      : 'border-border bg-surface hover:border-brand-soft-border'
                  }`}
                  key={`${candidate.lat}-${candidate.lng}-${index}`}
                  onClick={() => onSelectCandidate(candidate)}
                  type="button"
                >
                  <strong className="text-[14px] text-heading">{candidate.label}</strong>
                  <span className="text-[13px] text-subtle">{candidate.address}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {recentSearches.length > 0 && (
        <div className="mx-4 mt-4 border-t border-border pt-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-fg">
              최근 검색 {recentSearches.length}
            </span>
            <button
              className="min-h-[28px] rounded-md px-2 py-1 text-[12px] font-bold text-subtle transition-colors hover:text-brand"
              onClick={onClearRecent}
              type="button"
            >
              전체 지우기
            </button>
          </div>
          <div
            className="flex cursor-grab select-none gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            ref={tabsRef}
          >
            {recentSearches.map((item) => (
              <div
                className="flex flex-none items-center overflow-hidden rounded-full border border-border-strong bg-muted transition-colors hover:border-brand-soft-border"
                key={`${item.savedAt}-${item.lat}-${item.lng}`}
              >
                <button
                  className="max-w-[180px] truncate border-0 bg-transparent py-1.5 pl-[13px] pr-1 text-[13px] font-bold text-fg transition-colors hover:text-brand"
                  onClick={() => handleRunRecent(item)}
                  title={item.address}
                  type="button"
                >
                  {item.query}
                </button>
                <button
                  aria-label={`${item.query} 삭제`}
                  className="flex h-[30px] w-6 items-center justify-center border-0 bg-transparent text-[17px] leading-none text-subtle transition-colors hover:text-red-500"
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
