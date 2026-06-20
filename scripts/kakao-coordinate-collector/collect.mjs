import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { routes } from '../../src/data/routes.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.join(__dirname, 'output')
const reviewPath = path.join(outputDir, 'coords.review.json')
const queryOverridesPath = path.join(__dirname, 'query-overrides.json')
const KAKAO_KEYWORD_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'
const WONJU_CENTER = { lat: 37.3422, lng: 127.9202 }
const SEARCH_RADIUS_METERS = 20000

const args = new Set(process.argv.slice(2))
const shouldSelectFirst = args.has('--select-first')

async function main() {
  const restKey = process.env.KAKAO_REST_KEY

  if (!restKey || restKey === 'YOUR_KAKAO_REST_KEY') {
    throw new Error('KAKAO_REST_KEY가 없습니다. .env.local에 설정하고 node --env-file=.env.local로 실행하세요.')
  }

  const queryOverrides = await readQueryOverrides()
  const targets = routes.flatMap((route) =>
    route.stops.map((stop) => ({
      routeId: route.id,
      routeName: route.name,
      stopId: stop.id,
      stopName: stop.name,
      dong: stop.dong,
      query: queryOverrides[stop.id] ?? `원주시 ${stop.dong} ${stop.name}`,
    })),
  )

  await preflight(restKey)

  const items = []

  for (const [index, target] of targets.entries()) {
    const label = `${target.routeName} ${target.stopName}`
    process.stdout.write(`[${index + 1}/${targets.length}] ${label} ... `)

    try {
      const candidates = await searchKeyword(restKey, target.query)
      items.push({
        ...target,
        status: candidates.length > 0 ? 'OK' : 'ZERO_RESULT',
        selectedCandidateIndex: shouldSelectFirst && candidates.length > 0 ? 0 : null,
        selectedPlaceId: null,
        candidates,
      })
      process.stdout.write(`${candidates.length} candidates\n`)
    } catch (error) {
      items.push({
        ...target,
        status: 'ERROR',
        selectedCandidateIndex: null,
        selectedPlaceId: null,
        error: error instanceof Error ? error.message : String(error),
        candidates: [],
      })
      process.stdout.write('error\n')
    }

    await wait(180)
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(
    reviewPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'src/data/routes.ts',
        totalStops: targets.length,
        selectedCount: items.filter((item) => item.selectedCandidateIndex !== null || item.selectedPlaceId).length,
        reviewInstructions:
          '각 item의 candidates를 확인한 뒤 selectedCandidateIndex 또는 selectedPlaceId를 채우고 npm run coords:snippet을 실행하세요. 애매하면 null로 두세요.',
        items,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`\nWrote ${path.relative(process.cwd(), reviewPath)}`)
}

async function readQueryOverrides() {
  const raw = await readFile(queryOverridesPath, 'utf8')
  return JSON.parse(raw)
}

async function searchKeyword(restKey, query) {
  const url = new URL(KAKAO_KEYWORD_SEARCH_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('x', String(WONJU_CENTER.lng))
  url.searchParams.set('y', String(WONJU_CENTER.lat))
  url.searchParams.set('radius', String(SEARCH_RADIUS_METERS))
  url.searchParams.set('sort', 'accuracy')
  url.searchParams.set('size', '10')

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${restKey}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw createKakaoError(response.status, body)
  }

  const payload = await response.json()

  return payload.documents.map((place, index) => ({
    rank: index,
    kakaoPlaceId: place.id,
    placeName: place.place_name,
    categoryName: place.category_name,
    addressName: place.address_name,
    roadAddressName: place.road_address_name,
    lng: Number(place.x),
    lat: Number(place.y),
    phone: place.phone,
    placeUrl: place.place_url,
    distanceMeters: place.distance ? Number(place.distance) : null,
  }))
}

async function preflight(restKey) {
  try {
    await searchKeyword(restKey, '원주시청')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`카카오 Local API 사전 확인 실패: ${error.message}`)
    }

    throw error
  }
}

function createKakaoError(status, body) {
  let payload = null

  try {
    payload = JSON.parse(body)
  } catch {
    return new Error(`Kakao API ${status}: ${body}`)
  }

  if (status === 401) {
    return new Error('Kakao API 401: REST API 키가 올바르지 않습니다. .env.local의 KAKAO_REST_KEY를 확인하세요.')
  }

  if (status === 403 && payload.message?.includes('disabled OPEN_MAP_AND_LOCAL service')) {
    return new Error(
      'Kakao API 403: 이 앱에서 카카오맵/로컬 서비스가 비활성화되어 있습니다. 카카오 개발자 콘솔에서 앱의 카카오맵/로컬 제품을 활성화한 뒤 다시 실행하세요.',
    )
  }

  return new Error(`Kakao API ${status}: ${body}`)
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
