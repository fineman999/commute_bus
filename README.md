# 원주 통근버스 노선 확인 & 거리 분석

원주시 반곡동 혁신도시(**건강보험심사평가원**)로 운행하는 통근버스 노선을 지도로 시각화하고,
주소를 입력하면 **어느 정류장·노선이 가장 가까운지** 거리 기준으로 추천해주는 웹앱입니다.

집을 구할 때 "어느 동네에 살면 어떤 통근버스를 타기 편한가"를 판단하는 도구로 활용합니다.

🔗 **배포:** https://fineman999.github.io/commute_bus/

---

## 주요 기능

- **노선 시각화** — 출근/퇴근 방향별 노선을 지도(Kakao Map) 위에 정류장 마커 + 경로 폴리라인으로 표시
- **노선 목록 / 상세** — 노선 선택 시 경유 정류장·시간·행정동(동/면)을 표로 확인
- **주소 기반 거리 분석** — 주소 입력 → 좌표 변환(지오코딩) → 모든 정류장과의 Haversine 거리 계산 → **가장 가까운 Top 3 정류장/노선** 추천
- **동네별 추천 요약** — 동/면 기준 추천 노선 가이드 (예: 무실동 → 제8노선)
- **최근 검색 기록** — 최근 검색한 주소를 로컬에 저장/재검색

> 거리 추천은 **직선거리(Haversine)** 기준이라 실제 탑승 편의와 다를 수 있어, 정류장 단위와 노선 단위 추천을 함께 제공합니다.

---

## 기술 스택

| 영역 | 사용 |
|------|------|
| 빌드 | Vite |
| 언어 | TypeScript |
| 프레임워크 | React 19 |
| 지도 | Kakao Map JS SDK |
| 지오코딩 | Kakao Local API |
| 거리 계산 | 자체 Haversine 유틸 (의존성 없음) |
| 배포 | GitHub Pages (GitHub Actions) |

런타임 의존성은 React / React DOM 뿐이며, 지도·지오코딩은 Kakao SDK를 동적으로 로드합니다.

---

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`를 참고해 `.env.local`을 만들고 Kakao 키를 입력합니다.
([Kakao 개발자 콘솔](https://developers.kakao.com)에서 발급, **커밋 금지** — `.gitignore` 처리됨)

```bash
# .env.local
VITE_KAKAO_JS_KEY=발급받은_JavaScript_키   # 브라우저 앱 런타임용 (Web 플랫폼 도메인 등록 필요)
KAKAO_REST_KEY=발급받은_REST_API_키        # 좌표 수집 스크립트용 (로컬 전용)
```

> Kakao 콘솔 > 앱 > 플랫폼 > Web 에 사이트 도메인(`http://localhost:5173`, 배포 도메인)을 등록해야 지도가 동작합니다.

### 3. 개발 서버

```bash
npm run dev
```

---

## 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint |
| `npm test` | 테스트 실행 (`node --test`) |
| `npm run coords:collect` | 정류장 좌표 일괄 수집 (Kakao REST) |
| `npm run coords:snippet` | 수집한 좌표를 `routes.ts` 스니펫으로 변환 |
| `npm run routepath:collect` | 노선 경로(폴리라인) 좌표 수집 |

---

## 디렉토리 구조

```
src/
├── App.tsx                # 앱 셸 (방향 전환, 노선 선택, 주소 검색 상태)
├── main.tsx
├── types/
│   ├── route.ts           # Stop / BusRoute / NearestResult / Direction
│   └── kakao.d.ts         # Kakao SDK 타입
├── data/
│   ├── routes.ts          # 노선 데이터 (정류장·좌표·시간, 출근/퇴근)
│   └── routePaths.ts      # 노선별 경로 폴리라인 좌표
├── lib/
│   ├── distance.ts        # Haversine + findNearest
│   ├── geocode.ts         # 주소 → 좌표 (Kakao)
│   ├── kakaoLoader.ts     # Kakao SDK 동적 로더
│   └── searchStorage.ts   # 최근 검색 로컬 저장
└── components/
    ├── MapView.tsx        # Kakao 지도 (마커 + 폴리라인 + 오버레이)
    ├── RouteList.tsx      # 노선 목록
    ├── RouteDetail.tsx    # 노선 상세
    ├── AddressSearch.tsx  # 주소 입력 + 후보 선택
    ├── NearestResults.tsx # Top 3 추천
    └── NeighborhoodSummary.tsx # 동네별 추천

scripts/                   # 좌표·경로 일회성 수집 도구 (개발용)
docs/PLAN.md               # 개발 계획
INFO.md                    # 제품 브리프 + 전체 노선 원본 데이터
```

---

## 데이터 출처

전체 노선·정류장·시간 원본 데이터는 [`INFO.md`](./INFO.md)에 정리되어 있습니다.
`src/data/routes.ts`는 이 데이터를 기반으로 생성되며(`scripts/build-routes/build.mjs`),
정류장 좌표/행정동은 Kakao 키워드 검색으로 **1회 수집 후 정적으로 저장**합니다 (런타임 API 호출 최소화).

- 출근: 동네 출발 → **건강보험심사평가원 2사옥**(반곡동 2047-14) 도착
- 퇴근: **건강보험심사평가원 1사옥**(반곡동 2047-10) 출발 → 동네 도착

---

## 배포

`main` 브랜치 푸시 시 GitHub Actions(`.github/workflows`)가 빌드 후 GitHub Pages에 자동 배포합니다.
Kakao JS 키는 저장소 Secret(`VITE_KAKAO_JS_KEY`)에서 빌드 시 주입되며 소스에 포함되지 않습니다.

GitHub Pages 프로젝트 페이지(`/commute_bus/`) 하위에서 서빙되므로, 빌드 시 Vite `base`가 자동으로 설정됩니다.