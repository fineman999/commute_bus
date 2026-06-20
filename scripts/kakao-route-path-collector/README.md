# 카카오모빌리티 도로 경로 수집기

Phase 5-7에서 한 번만 쓰는 로컬 배치 스크립트입니다. `src/data/routes.ts`의 노선별 정류장 순서를 읽어 카카오모빌리티 길찾기(여러 경유지)로 **실제 도로 경로**를 받아 `src/data/routePaths.ts`에 정적 저장합니다.

좌표 수집기와 같은 원칙: REST 키는 **로컬 Node 전용**(번들/커밋 금지), 런타임에는 저장된 경로만 렌더 → CORS·키 노출 없이 GitHub Pages 정적 배포 유지.

## 환경 변수

`.env.local`:

```bash
KAKAO_REST_KEY=YOUR_KAKAO_REST_KEY
```

## 실행

```bash
npm run routepath:collect
```

출력: `src/data/routePaths.ts` (`Record<number, [lat, lng][]>`)

- 각 노선의 첫 정류장 = origin, 마지막 = destination, 중간 = waypoints
- 응답 `sections[].roads[].vertexes`(=[x,y,...])를 `[lat, lng]`로 변환, 소수 6자리, 연속 중복 제거
- `priority: RECOMMEND`(자동차 추천 경로)

## 주의

- 자동차 최적경로라 **실제 통근버스 운행 경로와 다를 수 있습니다**(도로 모양 근사 목적).
- MapView는 경로가 있으면 도로 폴리라인을, 없으면 정류장 직선 연결로 폴백합니다.
- 정류장 마커/라벨은 `routes.ts` 좌표 그대로 사용합니다.
