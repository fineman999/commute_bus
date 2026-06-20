# 원주 통근버스 노선 확인 & 거리 분석 웹앱

## 1. 프로젝트 개요

원주시 반곡동 혁신도시로 향하는 통근버스 9개 노선을 지도와 함께 시각화하고,
사용자가 **특정 주소를 입력하면 어느 노선/정류장에 가장 가까운지** 거리를 계산해주는 SPA.

집을 구할 때 "어느 동네에 살면 어떤 노선을 타기 편한가"를 판단하는 도구로 활용.

### 핵심 가치
- 노선별 경유 행정구역(동/면)을 한눈에 파악
- 주소 입력 → 가까운 정류장/노선 추천 (Haversine 거리 기반)
- 지도 위 노선·정류장 시각화

---

## 2. 기술 스택

| 영역 | 선택 | 비고 |
|------|------|------|
| 빌드 | **Vite** | 빠른 HMR |
| 언어 | **TypeScript** | 타입 안정성 |
| 프레임워크 | **React** | |
| 라우팅 | React Router | 노선 상세 페이지 분기 |
| 상태관리 | Zustand (경량) | 선택 노선/검색 상태 |
| 지도 | **react-leaflet + Leaflet** | 무료 OSM 타일 |
| 지오코딩 | Kakao Local API 또는 Nominatim(OSM) | 주소 → 좌표 변환 |
| 스타일 | Tailwind CSS | |
| 거리계산 | 자체 Haversine 유틸 | 외부 의존성 X |

> 주소 → 좌표 변환은 한국 주소 정확도가 높은 **Kakao Local API** 권장 (무료 쿼터 충분).
> API 키 없이 시작하려면 Nominatim으로 대체 가능.

---

## 3. 주요 기능

### F1. 노선 목록 / 상세
- 9개 노선 카드 리스트
- 노선 선택 시 경유 정류장 + 해당 동/면 표시
- 지도에 정류장 마커 + 경로 폴리라인 렌더링

### F2. 주소 기반 거리 분석 (핵심)
1. 사용자가 주소 입력 (예: "원주시 무실동 ...")
2. 지오코딩으로 위경도 변환
3. 모든 정류장과의 Haversine 거리 계산
4. **가장 가까운 정류장 Top 3** + 소속 노선 추천
5. 지도에 사용자 위치 ↔ 추천 정류장 라인 표시

### F3. 동네별 추천 요약
- 동/면 선택 시 "이 동네 = 추천 노선" 가이드 (무실동→8노선 등)

---

## 4. 데이터 모델

```typescript
// types/route.ts
interface Stop {
  id: string;
  name: string;          // 정류장명
  dong: string;          // 행정구역 (동/면)
  lat?: number;          // 좌표 (지오코딩으로 채움)
  lng?: number;
}

interface BusRoute {
  id: number;            // 1~9
  name: string;          // "제1노선 (태장동 → 단구동 코스)"
  description: string;
  stops: Stop[];
  color: string;         // 지도 폴리라인 색상
}

interface NearestResult {
  stop: Stop;
  route: BusRoute;
  distanceKm: number;
}
```

---

## 5. 초기 데이터 (정류장 ↔ 행정구역)

| 노선 | 코스 | 주요 정류장(동) |
|------|------|----------------|
| 제1노선 | 태장동→단구동 | 대원칸타빌·태장동보렉스(태장동), 원주초(개운동), 동보타워골드·프리미엄아울렛·단구초(단구동), 홈플러스원주점(관설동) |
| 제2노선 | 원동→단계동→명륜동 | e편한세상(원동), 원주터미널(단계동), 청소년수련관·치악체육관·종합운동장(명륜동), 롯데시네마남원주점(단구동) |
| 제3노선 | 단구동 아파트 단지 | 치악고·현진4차·청솔5차·청솔6·8차 (모두 단구동) |
| 제4노선 | 단계동→구도심→반곡동 | 봉화산푸르지오·봉화산주공·롯데/벽산·단계동주민센터(단계동), 법웅사·원주역폐역(학성동), 원일로중앙시장(중앙동), 원일로남부시장·원주고(개운동), 반곡아이파크~LH6단지(반곡동) |
| 제5노선 | 기업도시 | 반도유보라·롯데캐슬·호반베르디움(지정면 기업도시), 봉대초~LH6단지(반곡동) |
| 제6노선 | 조기출근 통합 | 지정면(기업도시)→단계동(봉화산·터미널)→명륜동(종합운동장)→단구동(프리미엄아울렛·단구초)→관설동(홈플러스)→반곡동(혁신도시) |
| 제7노선 | 반곡동 | 푸른숨LH9단지·봉대초·봉황사거리·LH6단지 (모두 반곡동) |
| 제8노선 | 무실동 | 무실초·무실부영·무실주공8차·동보노빌리티·남원주중·현대아파트 (모두 무실동) |
| 제9노선 | 만종역 | 만종역(호저면 만종리) |

> 모든 노선 종점은 **반곡동 혁신도시** (회사).

### 동네별 추천 요약
- **무실동**: 제8노선 — 다른 동네 안 거치고 무실동 순환 후 회사. 탑승 편리.
- **단구동**: 제1·2·3노선 — 거점(아파트·아울렛·롯데시네마) 다수 경유, 선택지 최다.
- **지정면(기업도시)**: 제5노선 전용 — 거리는 멀지만 환승 없이 직행.
- **반곡동(혁신도시)**: 제4·5·7노선 — 도보 애매한 거리 시 내부 순환 출근 지원.

---

## 6. 디렉토리 구조

```
src/
├── main.tsx
├── App.tsx
├── types/
│   └── route.ts
├── data/
│   └── routes.ts          # 위 표 데이터 하드코딩
├── lib/
│   ├── distance.ts        # Haversine
│   └── geocode.ts         # 주소→좌표 (Kakao/Nominatim)
├── store/
│   └── useAppStore.ts     # Zustand
├── components/
│   ├── MapView.tsx        # react-leaflet 지도
│   ├── RouteList.tsx      # 노선 목록
│   ├── RouteDetail.tsx    # 노선 상세
│   ├── AddressSearch.tsx  # 주소 입력 + 결과
│   └── NearestResult.tsx  # Top3 추천
└── pages/
    ├── HomePage.tsx
    └── AnalyzePage.tsx
```

---

## 7. 핵심 유틸 (Haversine)

```typescript
// lib/distance.ts
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearest(
  userLat: number, userLng: number,
  routes: BusRoute[], topN = 3
): NearestResult[] {
  return routes
    .flatMap((route) =>
      route.stops
        .filter((s) => s.lat && s.lng)
        .map((stop) => ({
          stop,
          route,
          distanceKm: haversineKm(userLat, userLng, stop.lat!, stop.lng!),
        }))
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, topN);
}
```

---

## 8. 개발 단계 (Phase)

| Phase | 내용 |
|-------|------|
| **1** | Vite 셋업 + 노선 데이터 입력 + 노선 목록/상세 UI |
| **2** | 정류장 좌표 확보 (지오코딩 1회 실행 후 캐싱 or 수동 입력) + 지도 시각화 |
| **3** | 주소 검색 → Top3 추천 거리 분석 |
| **4** | 동네별 추천 가이드 + UI 다듬기 + 배포(Vercel/GitHub Pages) |

---

## 9. 시작 명령어

```bash
npm create vite@latest commute-bus -- --template react-ts
cd commute-bus
npm install react-router-dom zustand leaflet react-leaflet
npm install -D tailwindcss @types/leaflet
npm run dev
```

---

## 10. 고려사항 / 리스크

- **정류장 좌표**: 정류장명만 있고 좌표 없음 → 초기 1회 지오코딩 후 `routes.ts`에 좌표 박아두는 방식 권장 (런타임 API 호출 최소화).
- **지오코딩 정확도**: "단구초등학교" 같은 명칭은 Kakao 키워드 검색이 도로명주소보다 정확.
- **거리 ≠ 실제 탑승 편의**: 직선거리 기준이므로 "가장 가까운 정류장"이 항상 최선은 아님 → 노선 단위 추천도 병행.