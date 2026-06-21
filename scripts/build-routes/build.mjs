import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// INFO.md(정확 데이터) 기준으로 src/data/routes.ts 를 생성한다(출근+퇴근).
// 정류장 좌표/행정동은 카카오 키워드 검색. REST 키는 로컬 전용.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../../src/data/routes.ts')
const CENTER = { x: 127.9202, y: 37.3422 }

// 출근 종착지(2사옥) / 퇴근 출발지(1사옥)
const TERM2 = { name: '건강보험심사평가원 2사옥', dong: '반곡동', lat: 37.32103, lng: 127.98083 }
const TERM1 = { name: '건강보험심사평가원 1사옥', dong: '반곡동', lat: 37.3225, lng: 127.98068 }

// 정류장: name, code, time, query, fallbackDong(지오코딩 실패 시 좌표 없이 사용)
const s = (name, code, time, query, fallbackDong) => ({
  name,
  code,
  time,
  query: query ?? `원주 ${name}`,
  fallbackDong,
})
const end2 = () => ({ name: TERM2.name, fixed: TERM2 }) // 출근 종착(시각 없음)
const start1 = (time) => ({ name: TERM1.name, fixed: TERM1, time }) // 퇴근 출발(시각 있음)

// 심야퇴근 공통 경유(1~3 동일)
const NIGHT_STOPS = () => [
  s('LH6단지아파트', '68-060', null, 'LH센트럴파크6단지아파트'),
  s('봉대초등학교', '68-042', null, '봉대초등학교'),
  s('원주여고', '68-051', null, '원주여자고등학교'),
  s('청솔6·8차아파트', '68-018', null, '원주단관청솔6차아파트'),
  s('청솔5차아파트', '68-016', null, '원주단관청솔5차아파트'),
  s('단구초등학교', '56-021', null, '원주시 단구동 단구초등학교'),
  s('프리미엄아울렛', '56-001', null, '원주프리미엄아울렛'),
  s('종합운동장', '54-028', null, '원주종합운동장'),
  s('무실부영아파트', '67-271', null, '무실부영'),
  s('무실초등학교', '67-012', null, '원주 무실초등학교'),
  s('원주터미널', '60-037', null, '원주종합버스터미널'),
  s('봉화산주공아파트', '60-032', null, '원주봉화산주공아파트'),
  s('기업도시 호반베르디움', '68-410', null, '원주 기업도시 호반베르디움'),
  s('기업도시 롯데캐슬 골드파크1차', '68-462', null, '원주 롯데캐슬골드파크1차'),
]

const ROUTES = [
  // ── 출근 (도착: 2사옥) ──
  { id: 1, direction: '출근', color: '#2563eb', description: '태장동에서 단구동·관설동을 거쳐 심평원 2사옥으로 이동합니다.', stops: [
    s('대원칸타빌', '63-019', '8:00', '원주시 태장동 대원칸타빌'),
    s('태장동보렉스', '63-044', '8:01', '원주 태장동보렉스아파트'),
    s('원주초등학교', '64-027', '8:08', '원주시 개운동 원주초등학교'),
    s('동보타워골드', '56-027', '8:19', '원주 단구동 동보타워골드'),
    s('프리미엄아울렛', '56-060', '8:20', '원주프리미엄아울렛'),
    s('단구초등학교', '56-022', '8:21', '원주시 단구동 단구초등학교'),
    s('홈플러스원주점', '56-011', '8:25', '홈플러스 원주점'),
    end2(),
  ] },
  { id: 2, direction: '출근', color: '#059669', description: '단계동·명륜동·단구동 거점을 거쳐 심평원 2사옥으로 향합니다.', stops: [
    s('e편한세상아파트', '60-002', '8:10', '봉화산e편한세상아파트'),
    s('원주터미널', '60-036', '8:13', '원주종합버스터미널'),
    s('청소년수련관', '60-041', '8:14', '원주시청소년수련관'),
    s('치악체육관', '68-621', '8:16', '치악체육관'),
    s('종합운동장', '54-021', '8:18', '원주종합운동장'),
    s('롯데시네마', '53-004', '8:21', '롯데시네마 남원주'),
    end2(),
  ] },
  { id: 3, direction: '출근', color: '#dc2626', description: '단구·관설 경계 아파트 단지를 집중 경유합니다.', stops: [
    s('치악고등학교', '68-020', '8:22', '원주 치악고등학교'),
    s('현진4차아파트', '68-023', '8:23', '원주 현진에버빌4차아파트'),
    s('청솔5차아파트', '68-015', '8:24', '원주단관청솔5차아파트'),
    s('청솔6·8차아파트', '68-017', '8:26', '원주단관청솔6차아파트'),
    end2(),
  ] },
  { id: 4, direction: '출근', color: '#7c3aed', description: '단계동에서 구도심을 지나 반곡동 내부까지 폭넓게 연결합니다.', stops: [
    s('봉화산푸르지오', '68-206', '7:56', '원주봉화산푸르지오아파트'),
    s('봉화산주공아파트', '60-031', '7:58', '원주봉화산주공아파트'),
    s('롯데아파트앞', '60-023', '7:59', '원주 단계동 롯데아파트'),
    s('벽산아파트', '60-027', '7:59', '원주 단계동 벽산아파트'),
    s('단계동 주민센터', '60-008', '8:01', '단계동 행정복지센터'),
    s('법웅사', '58-004', '8:01', '원주 법웅사'),
    s('원주역(폐역)', '58-011', '8:06', '옛원주역 택시승강장'),
    s('원일로 중앙시장', '57-006', '8:09', '미로예술 원주중앙시장'),
    s('원일로 남부시장', '54-002', '8:11', '원주남부시장'),
    s('원주고등학교', '53-016', '8:13', '원주고등학교'),
    s('반곡아이파크', '68-034', '8:21', '원주반곡아이파크아파트'),
    s('아이파크후문', '68-043', '8:23', '원주반곡아이파크아파트'),
    s('입춘내', '68-601', '8:26', '원주 반곡동 입춘내'),
    s('반곡중학교', '68-599', '8:26', '원주 반곡중학교'),
    s('원주여고(혁신중흥S클래스)', '68-050', '8:28', '원주여자고등학교'),
    s('봉대초등학교', '68-040', '8:30', '봉대초등학교'),
    s('봉황사거리', '68-038', '8:32', '봉황사거리'),
    s('LH6단지아파트', '68-059', '8:34', 'LH센트럴파크6단지아파트'),
    end2(),
  ] },
  { id: 5, direction: '출근', color: '#ea580c', description: '지정면 기업도시에서 직행 후 반곡동을 한 바퀴 돕니다.', stops: [
    s('기업도시 반도유보라2단지', '68-459', '7:45', '원주기업도시 반도유보라아이비파크2단지'),
    s('기업도시 롯데캐슬 골드파크1차', '68-461', '7:48', '원주 롯데캐슬골드파크1차'),
    s('기업도시 롯데캐슬 골드파크2차', '68-452', '7:51', '원주 롯데캐슬골드파크2차'),
    s('기업도시 호반베르디움', '68-409', '7:53', '원주 기업도시 호반베르디움'),
    s('기업도시 롯데캐슬 더퍼스트 2차', '68-399', '7:55', '원주 롯데캐슬더퍼스트2차'),
    end2(),
    s('봉대초등학교', '68-040', '8:30', '봉대초등학교'),
    s('봉황사거리', '68-038', '8:32', '봉황사거리'),
    s('LH6단지아파트', '68-059', '8:34', 'LH센트럴파크6단지아파트'),
    end2(),
  ] },
  { id: 6, direction: '출근', color: '#0891b2', description: '기업도시·단계동·명륜동·단구동을 잇는 조기출근 통합 노선입니다.', stops: [
    s('기업도시 롯데캐슬 골드파크1차', '68-461', '6:52', '원주 롯데캐슬골드파크1차'),
    s('기업도시 호반베르디움', '68-409', '6:54', '원주 기업도시 호반베르디움'),
    s('봉화산주공아파트', '60-031', '7:07', '원주봉화산주공아파트'),
    s('원주터미널', '60-036', '7:13', '원주종합버스터미널'),
    s('종합운동장', '54-021', '7:16', '원주종합운동장'),
    s('프리미엄아울렛', '56-060', '7:22', '원주프리미엄아울렛'),
    s('단구초등학교', '56-022', '7:24', '원주시 단구동 단구초등학교'),
    s('홈플러스원주점', '56-011', '7:26', '홈플러스 원주점'),
    s('원주여고(혁신중흥S클래스)', '68-050', '7:33', '원주여자고등학교'),
    s('푸른숨LH9단지', '68-041', '7:34', '푸른숨LH9단지아파트'),
    s('봉대초등학교', '68-040', '7:36', '봉대초등학교'),
    s('봉황사거리', '68-038', '7:38', '봉황사거리'),
    s('LH6단지아파트', '68-059', '7:40', 'LH센트럴파크6단지아파트'),
    end2(),
  ] },
  { id: 7, direction: '출근', color: '#65a30d', description: '반곡동 혁신도시 생활권을 두 바퀴 순환합니다.', stops: [
    s('푸른숨LH9단지', '68-041', '8:02', '푸른숨LH9단지아파트'),
    s('봉대초등학교', '68-040', '8:04', '봉대초등학교'),
    s('봉황사거리', '68-038', '8:06', '봉황사거리'),
    s('LH6단지아파트', '68-059', '8:08', 'LH센트럴파크6단지아파트'),
    end2(),
    s('푸른숨LH9단지', '68-041', '8:28', '푸른숨LH9단지아파트'),
    s('봉대초등학교', '68-040', '8:30', '봉대초등학교'),
    s('봉황사거리', '68-038', '8:32', '봉황사거리'),
    s('LH6단지아파트', '68-059', '8:34', 'LH센트럴파크6단지아파트'),
    end2(),
  ] },
  { id: 8, direction: '출근', color: '#db2777', description: '무실동을 순환한 뒤 심평원 2사옥으로 이동합니다.', stops: [
    s('무실초등학교', '67-012', '8:10', '원주 무실초등학교'),
    s('무실부영아파트', '11-045', '8:14', '무실부영'),
    s('무실주공8차아파트', '68-277', '8:17', '원주무실8단지LH아파트'),
    s('동보노빌리티(포스코)', '37-022', '8:19', '동보노빌리티2단지아파트'),
    s('남원주중학교', '37-017', '8:20', '원주 무실동 남원주중학교'),
    s('현대아파트', '56-064', '8:22', '구곡현대2차아파트'),
    end2(),
  ] },
  { id: 9, direction: '출근', color: '#475569', description: '만종역 생활권에서 심평원 2사옥으로 이동합니다.', stops: [
    s('만종역', '68-359', '8:15', '만종역'),
    end2(),
  ] },

  // ── 퇴근 (출발: 1사옥) ──
  { id: 21, direction: '퇴근', color: '#2563eb', description: '1사옥에서 출발해 반곡동·단구동·태장동으로 향합니다.', stops: [
    start1('18:30'),
    s('LH6단지아파트', '68-060', null, 'LH센트럴파크6단지아파트'),
    s('봉황사거리', '68-039', null, '봉황사거리'),
    s('부영6단지', '68-304', null, '원주혁신도시 부영6단지', '반곡동'),
    s('단구동주민센터', '66-006', null, '원주 단구동 행정복지센터'),
    s('나르내사거리', '66-004', null, '원주 단구동 나르내사거리', '단구동'),
    s('통신아파트', '64-003', null, '원주 우산동 통신아파트', '우산동'),
    s('원주초등학교', '64-028', null, '원주시 개운동 원주초등학교'),
    s('태장1동주민센터', '63-038', null, '원주 태장1동 행정복지센터'),
    s('태장동보렉스', '63-045', null, '원주 태장동보렉스아파트'),
    s('대원칸타빌', '63-018', null, '원주시 태장동 대원칸타빌'),
  ] },
  { id: 22, direction: '퇴근', color: '#059669', description: '1사옥에서 출발해 단구동·명륜동·단계동으로 향합니다.', stops: [
    start1('18:30'),
    s('동보타워골드', '56-061', null, '원주 단구동 동보타워골드'),
    s('롯데시네마', '53-019', null, '롯데시네마 남원주'),
    s('종합운동장', '54-028', null, '원주종합운동장'),
    s('치악체육관', '54-029', null, '치악체육관'),
    s('청소년수련관', '60-046', null, '원주시청소년수련관'),
    s('원주터미널', '60-037', null, '원주종합버스터미널'),
    s('e편한세상아파트', '60-003', null, '봉화산e편한세상아파트'),
    s('봉화산주공아파트', '60-032', null, '원주봉화산주공아파트'),
    s('봉화산푸르지오', '68-085', null, '원주봉화산푸르지오아파트'),
  ] },
  { id: 23, direction: '퇴근', color: '#dc2626', description: '1사옥에서 출발해 무실동으로 향합니다.', stops: [
    start1('18:30'),
    s('원주역', '68-639', null, '원주역'),
    s('무실세영리첼', '67-019', null, '원주 무실세영리첼'),
    s('무실우미린아파트', '68-261', null, '원주 무실우미린아파트'),
    s('무실초등학교', '67-011', null, '원주 무실초등학교'),
  ] },
  { id: 24, direction: '퇴근', color: '#7c3aed', description: '1사옥에서 출발해 관설·단구·무실동으로 향합니다.', stops: [
    start1('18:30'),
    s('청솔6·8차아파트', '68-018', null, '원주단관청솔6차아파트'),
    s('청솔5차아파트', '68-016', null, '원주단관청솔5차아파트'),
    s('현진4차아파트', '68-023 맞은편', null, '원주 현진에버빌4차아파트'),
    s('치악고등학교', '68-019', null, '원주 치악고등학교'),
    s('현대아파트', '56-043', null, '구곡현대2차아파트'),
    s('남원주중학교', '56-044', null, '원주 무실동 남원주중학교'),
    s('동보노빌리티(포스코)', '56-023', null, '동보노빌리티2단지아파트'),
    s('무실주공8차아파트', '68-278', null, '원주무실8단지LH아파트'),
  ] },
  { id: 25, direction: '퇴근', color: '#ea580c', description: '1사옥에서 출발해 반곡동을 거쳐 구도심·단계동으로 향합니다.', stops: [
    start1('18:30'),
    s('봉대초등학교', '68-042', null, '봉대초등학교'),
    s('푸른숨LH9단지', '68-052', null, '푸른숨LH9단지아파트'),
    s('원주여고(혁신중흥S클래스)', '68-051', null, '원주여자고등학교'),
    s('반곡중학교정문', '68-598', null, '원주 반곡중학교'),
    s('입춘내', '68-600', null, '원주 반곡동 입춘내'),
    s('아이파크후문', '68-044', null, '원주반곡아이파크아파트'),
    s('반곡아이파크', '68-035', null, '원주반곡아이파크아파트'),
    s('원주고등학교', '53-015', null, '원주고등학교'),
    s('원일로 남부시장', '54-002 맞은편', null, '원주남부시장'),
    s('원일로 중앙시장', '57-006 맞은편', null, '미로예술 원주중앙시장'),
    s('원주역(폐역)', '58-011 맞은편', null, '옛원주역 택시승강장'),
    s('법웅사', '58-003', null, '원주 법웅사'),
    s('원주세무서', '58-009', null, '원주세무서'),
    s('장미아파트', '60-028', null, '원주 단계동 장미아파트'),
    s('롯데아파트', '60-020', null, '원주 단계동 롯데아파트'),
  ] },
  { id: 26, direction: '퇴근', color: '#0891b2', description: '1사옥에서 출발해 단구동·만종역·기업도시로 향합니다.', stops: [
    start1('18:30'),
    s('홈플러스 원주점', '56-051', null, '홈플러스 원주점'),
    s('단구초등학교', '56-021', null, '원주시 단구동 단구초등학교'),
    s('프리미엄아울렛', '56-001', null, '원주프리미엄아울렛'),
    s('만종역', '68-360', null, '만종역'),
    s('기업도시 롯데캐슬더퍼스트2차', '68-400', null, '원주 롯데캐슬더퍼스트2차'),
    s('기업도시 호반베르디움', '68-410', null, '원주 기업도시 호반베르디움'),
    s('기업도시 롯데캐슬골드파크2차', '68-451', null, '원주 롯데캐슬골드파크2차'),
    s('기업도시 롯데캐슬골드파크1차', '68-462', null, '원주 롯데캐슬골드파크1차'),
    s('기업도시 반도유보라2단지', '68-459 맞은편', null, '원주기업도시 반도유보라아이비파크2단지'),
  ] },
  { id: 27, direction: '퇴근', color: '#9333ea', description: '심야퇴근(20시) — 반곡동·단구동·무실동·기업도시 경유.', stops: [start1('20:00'), ...NIGHT_STOPS()] },
  { id: 28, direction: '퇴근', color: '#0d9488', description: '심야퇴근(21시) — 경유는 심야퇴근1과 동일.', stops: [start1('21:00'), ...NIGHT_STOPS()] },
  { id: 29, direction: '퇴근', color: '#c2410c', description: '심야퇴근(22시) — 경유는 심야퇴근1과 동일.', stops: [start1('22:00'), ...NIGHT_STOPS()] },
  { id: 30, direction: '퇴근', color: '#475569', description: '1사옥에서 출발하는 만종역 직행(17:10).', stops: [
    start1('17:10'),
    s('만종역', '68-360', null, '만종역'),
  ] },
]

const NAMES = {
  1: '제1노선', 2: '제2노선', 3: '제3노선', 4: '제4노선', 5: '제5노선',
  6: '제6노선', 7: '제7노선', 8: '제8노선', 9: '제9노선',
  21: '제1노선', 22: '제2노선', 23: '제3-1노선', 24: '제3-2노선', 25: '제4노선',
  26: '제5노선', 27: '심야퇴근1', 28: '심야퇴근2', 29: '심야퇴근3', 30: '만종역',
}

const NEIGHBORHOODS = [
  { dong: '무실동', route: '제8노선', summary: '다른 동네를 거의 거치지 않고 무실동 주요 지점을 지나 심평원으로 향해 탑승 편의가 높습니다.' },
  { dong: '단구동', route: '제1·2·3노선', summary: '아파트 단지, 아울렛, 롯데시네마 등 거점이 많아 선택지가 가장 넓습니다.' },
  { dong: '지정면(기업도시)', route: '제5·6노선', summary: '거리는 멀지만 기업도시에서 심평원까지 환승 없이 이동할 수 있습니다.' },
  { dong: '반곡동(혁신도시)', route: '제4·5·7노선', summary: '도보가 애매한 거리에서는 반곡동 내부 순환 성격의 노선을 활용할 수 있습니다.' },
]

const cache = new Map()

async function geocode(restKey, query) {
  if (cache.has(query)) return cache.get(query)
  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json')
  url.searchParams.set('query', query)
  url.searchParams.set('x', String(CENTER.x))
  url.searchParams.set('y', String(CENTER.y))
  url.searchParams.set('radius', '20000')
  url.searchParams.set('sort', 'accuracy')
  url.searchParams.set('size', '1')
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${restKey}` } })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const doc = (await res.json()).documents?.[0]
  const result = doc
    ? { lat: Number(doc.y), lng: Number(doc.x), dong: dongOf(doc.address_name), place: doc.place_name }
    : null
  cache.set(query, result)
  return result
}

function dongOf(jibun) {
  const m = /원주시\s+([^\s]+?[동면읍])/.exec(jibun ?? '')
  return m ? m[1] : ''
}

const q = (str) => `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

async function main() {
  const restKey = process.env.KAKAO_REST_KEY
  if (!restKey || restKey === 'YOUR_KAKAO_REST_KEY') {
    throw new Error('KAKAO_REST_KEY가 없습니다. node --env-file=.env.local 로 실행하세요.')
  }

  let out = `import type { BusRoute } from '../types/route'\n\n`
  out += `// INFO.md(정확 데이터) 기준 생성: scripts/build-routes/build.mjs (출근+퇴근)\n`
  out += `// 좌표/행정동은 카카오 키워드 검색 1회 수집. 출근 도착=2사옥, 퇴근 출발=1사옥.\n`
  out += `export const routes: BusRoute[] = [\n`

  for (const route of ROUTES) {
    out += `  {\n    id: ${route.id},\n    name: ${q(NAMES[route.id])},\n    direction: ${q(route.direction)},\n    description: ${q(route.description)},\n    color: ${q(route.color)},\n    stops: [\n`
    let n = 0
    for (const stop of route.stops) {
      n += 1
      const id = `r${route.id}-s${n}`
      const fields = [`id: ${q(id)}`, `name: ${q(stop.name)}`]
      let dong = ''
      let lat
      let lng
      if (stop.fixed) {
        dong = stop.fixed.dong
        lat = stop.fixed.lat
        lng = stop.fixed.lng
      } else {
        const g = await geocode(restKey, stop.query)
        if (g) {
          dong = g.dong
          lat = g.lat
          lng = g.lng
          const dist = haversine(CENTER.y, CENTER.x, lat, lng)
          console.log(`${id} ${stop.name} -> ${g.place} [${dong}] ${dist.toFixed(1)}km`)
        } else {
          dong = stop.fallbackDong ?? ''
          console.warn(`WARN 좌표없음: ${id} ${stop.name} | ${stop.query} -> dong=${dong || '?'}`)
        }
      }
      fields.push(`dong: ${q(dong)}`)
      if (stop.code) fields.push(`code: ${q(stop.code)}`)
      if (stop.time) fields.push(`time: ${q(stop.time)}`)
      if (lat !== undefined && lng !== undefined) fields.push(`lat: ${lat}`, `lng: ${lng}`)
      out += `      { ${fields.join(', ')} },\n`
    }
    out += `    ],\n  },\n`
  }
  out += `]\n\nexport const neighborhoodRecommendations = [\n`
  for (const item of NEIGHBORHOODS) {
    out += `  {\n    dong: ${q(item.dong)},\n    route: ${q(item.route)},\n    summary: ${q(item.summary)},\n  },\n`
  }
  out += `]\n`

  await writeFile(OUT, out)
  console.log(`\nWrote ${path.relative(process.cwd(), OUT)} (${ROUTES.length} routes)`)
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
