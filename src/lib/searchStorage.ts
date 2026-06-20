// 최근 검색 기록을 localStorage에 저장한다.
// localStorage는 네이티브 만료가 없으므로 savedAt 타임스탬프로 TTL(7일)을 직접 적용한다.
// 개수 제한은 없고, 읽기/쓰기 시점에 만료분만 정리한다.

export interface SavedSearch {
  query: string
  label: string
  address: string
  lat: number
  lng: number
  savedAt: number
}

const STORAGE_KEY = 'commute-bus:recent-searches'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7일

function isSavedSearch(value: unknown): value is SavedSearch {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.query === 'string' &&
    typeof entry.label === 'string' &&
    typeof entry.address === 'string' &&
    typeof entry.lat === 'number' &&
    typeof entry.lng === 'number' &&
    typeof entry.savedAt === 'number'
  )
}

function readRaw(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSavedSearch)
  } catch {
    // 손상된 JSON 등은 빈 목록으로 처리
    return []
  }
}

function writeRaw(entries: SavedSearch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // 시크릿 모드 / 저장 쿼터 초과 등은 조용히 무시
  }
}

function prune(entries: SavedSearch[]): SavedSearch[] {
  const now = Date.now()
  return entries.filter((entry) => now - entry.savedAt < TTL_MS)
}

export function loadRecentSearches(): SavedSearch[] {
  const fresh = prune(readRaw())
  writeRaw(fresh) // 만료분 정리를 저장에도 반영
  return fresh
}

// 같은 질의는 최신 항목으로 갱신(상단 이동)하고 최신순으로 보관한다.
export function saveRecentSearch(entry: SavedSearch): SavedSearch[] {
  const key = entry.query.trim().toLowerCase()
  const rest = prune(readRaw()).filter((item) => item.query.trim().toLowerCase() !== key)
  const next = [entry, ...rest]
  writeRaw(next)
  return next
}

// 특정 질의 하나만 삭제
export function removeRecentSearch(query: string): SavedSearch[] {
  const key = query.trim().toLowerCase()
  const next = prune(readRaw()).filter((item) => item.query.trim().toLowerCase() !== key)
  writeRaw(next)
  return next
}

export function clearRecentSearches(): void {
  writeRaw([])
}
