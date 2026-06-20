# 카카오 REST 좌표 수집기

Phase 2에서 한 번만 쓰는 로컬 배치 스크립트입니다. `src/data/routes.ts`의 정류장 목록을 읽고 카카오 Local REST API 키워드 검색으로 후보 좌표를 수집합니다.

REST 키는 사용자 브라우저 번들에 넣으면 안 됩니다. 이 스크립트는 로컬 Node에서만 실행하고 결과 파일만 검토하므로 REST 키를 `.env.local`에 두고 커밋하지 않으면 됩니다.

## 환경 변수

`.env.local`:

```bash
KAKAO_REST_KEY=YOUR_KAKAO_REST_KEY
```

## 실행

후보 수집:

```bash
npm run coords:collect
```

출력:

```text
scripts/kakao-coordinate-collector/output/coords.review.json
```

스크립트는 실제 정류장 검색 전에 `원주시청`으로 사전 확인을 합니다. 여기서 403이 나면 카카오 개발자 콘솔에서 해당 앱의 **카카오맵/로컬** 제품이 활성화되어 있는지 확인하세요.

키워드 검색은 원주시청 인근 좌표 기준 반경 20km로 제한하고, 후보 순서는 정확도순(`sort=accuracy`)으로 받습니다. 카카오 Local API의 `radius` 최대값이 20,000m이므로 더 넓게 잡지 않습니다.

`coords.review.json`을 열어 각 item의 `candidates`를 검토한 뒤 둘 중 하나를 채웁니다.

```json
{
  "selectedCandidateIndex": 0,
  "selectedPlaceId": null
}
```

또는:

```json
{
  "selectedCandidateIndex": null,
  "selectedPlaceId": "카카오_place_id"
}
```

애매한 정류장은 `null`로 둡니다.

검토 결과로 좌표 스니펫 생성:

```bash
npm run coords:snippet
```

출력:

```text
scripts/kakao-coordinate-collector/output/coords.selected.json
scripts/kakao-coordinate-collector/output/routes-coordinate-snippet.ts
```

`routes-coordinate-snippet.ts`는 `src/data/routes.ts`에 좌표를 옮길 때 참고용입니다. 그대로 복사하기 전에 실제 승차 위치와 맞는지 확인하세요.

## 검색어 보정

기본 검색어는 다음 형식입니다.

```text
원주시 {동/면} {정류장명}
```

검색어가 약한 정류장은 `query-overrides.json`에서 보정합니다.

## 자동 선택 옵션

상위 후보를 일괄 선택해 초안을 만들고 싶을 때만 사용합니다.

```bash
npm run coords:collect -- --select-first
```

이 옵션은 검토 시간을 줄이는 용도일 뿐입니다. 좌표를 확정하기 전에 반드시 후보 주소를 확인하세요.
