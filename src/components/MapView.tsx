import { useEffect, useRef, useState } from 'react'
import { loadKakaoSdk } from '../lib/kakaoLoader'
import { routePaths } from '../data/routePaths'
import type { GeocodeResult } from '../lib/geocode'
import type { BusRoute, NearestResult } from '../types/route'

interface MapViewProps {
  routes: BusRoute[]
  visibleRouteIds: number[]
  userLocation: GeocodeResult | null
  nearestResults: NearestResult[]
  focusedStopId: string | null
}

const WONJU_CENTER = { lat: 37.3422, lng: 127.9202 }

export function MapView({
  routes,
  visibleRouteIds,
  userLocation,
  nearestResults,
  focusedStopId,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const overlaysRef = useRef<KakaoOverlay[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // SDK 로드 + 지도 1회 생성
  useEffect(() => {
    let cancelled = false

    loadKakaoSdk()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const { maps } = window.kakao
        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(WONJU_CENTER.lat, WONJU_CENTER.lng),
          level: 6,
        })
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : '지도를 불러오지 못했습니다.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // 컨테이너 크기가 바뀌면 지도를 다시 맞춘다(relayout 안 하면 타일이 컨테이너 밖으로 새서
  // 좌측 컨트롤을 덮음). window resize는 그리드 reflow 전에 발생해 폭이 stale이라
  // 컨테이너 자체를 ResizeObserver로 보고, relayout은 다음 프레임(레이아웃 확정 후)에 실행.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const map = mapRef.current
        if (!map) return
        const center = map.getCenter()
        map.relayout()
        map.setCenter(center)
      })
    })
    observer.observe(container)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  // 표시 노선/검색/포커스가 바뀔 때마다 오버레이 다시 그림
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return

    const { maps } = window.kakao

    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = []
    const track = (overlay: KakaoOverlay) => overlaysRef.current.push(overlay)

    const visibleRoutes = routes.filter((route) => visibleRouteIds.includes(route.id))
    const showLabels = visibleRoutes.length === 1
    const topStopIds = new Set(nearestResults.map((result) => result.stop.id))

    const bounds = new maps.LatLngBounds()
    let hasBoundsPoint = false
    let focusPosition: KakaoLatLng | null = null

    visibleRoutes.forEach((route) => {
      const stops = route.stops.filter((stop) => stop.lat !== undefined && stop.lng !== undefined)
      // 도로 경로(precompute)가 있으면 도로를 따라 그리고, 없으면 정류장 직선 연결로 폴백
      const roadPath = routePaths[route.id]
      const linePath =
        roadPath && roadPath.length > 1
          ? roadPath.map(([lat, lng]) => new maps.LatLng(lat, lng))
          : stops.map((stop) => new maps.LatLng(stop.lat!, stop.lng!))

      if (linePath.length > 1) {
        track(
          new maps.Polyline({
            path: linePath,
            strokeWeight: 5,
            strokeColor: route.color,
            strokeOpacity: 0.85,
            strokeStyle: 'solid',
            map,
          }),
        )
      }

      stops.forEach((stop) => {
        const position = new maps.LatLng(stop.lat!, stop.lng!)
        bounds.extend(position)
        hasBoundsPoint = true
        const focused = stop.id === focusedStopId
        if (focused) focusPosition = position

        track(
          new maps.CustomOverlay({
            position,
            content: `<span class="map-stop-dot${focused ? ' focused' : ''}" style="background:${route.color}"></span>`,
            map,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: focused ? 6 : 2,
          }),
        )

        if (showLabels || focused || topStopIds.has(stop.id)) {
          track(
            new maps.CustomOverlay({
              position,
              content: `<span class="map-stop-label${focused ? ' focused' : ''}">${stop.name}</span>`,
              map,
              xAnchor: 0.5,
              yAnchor: 0,
              zIndex: focused ? 6 : 3,
            }),
          )
        }
      })
    })

    if (userLocation) {
      const userPosition = new maps.LatLng(userLocation.lat, userLocation.lng)
      bounds.extend(userPosition)
      hasBoundsPoint = true
      track(
        new maps.CustomOverlay({
          position: userPosition,
          content: '<span class="map-user-pin">내 위치</span>',
          map,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 7,
        }),
      )

      nearestResults.forEach((result, index) => {
        if (result.stop.lat === undefined || result.stop.lng === undefined) return
        const stopPosition = new maps.LatLng(result.stop.lat, result.stop.lng)
        bounds.extend(stopPosition)
        hasBoundsPoint = true
        track(
          new maps.Polyline({
            path: [userPosition, stopPosition],
            strokeWeight: 3,
            strokeColor: '#1e293b',
            strokeOpacity: 0.6,
            strokeStyle: 'shortdash',
            map,
          }),
        )
        track(
          new maps.CustomOverlay({
            position: stopPosition,
            content: `<span class="map-rank-badge">${index + 1}</span>`,
            map,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 8,
          }),
        )
      })
    }

    // 포커스된 정류장이 있으면 그쪽으로 이동, 아니면 전체가 보이도록 맞춤
    if (focusPosition) {
      map.setLevel(4)
      map.setCenter(focusPosition)
    } else if (hasBoundsPoint) {
      map.setBounds(bounds)
    }
  }, [routes, visibleRouteIds, userLocation, nearestResults, focusedStopId, status])

  // 지도 위 범례/빈 상태 안내에 쓰는 표시 중 노선 목록(렌더 시점 기준)
  const visibleRoutes = routes.filter((route) => visibleRouteIds.includes(route.id))

  const overlayBase =
    'absolute inset-0 z-[1] flex items-center justify-center gap-2.5 p-6 text-center text-[14px] font-bold'

  return (
    <section className="panel pb-4" aria-labelledby="map-title">
      <div className="section-heading flex flex-col gap-1 min-[560px]:flex-row min-[560px]:items-end min-[560px]:justify-between">
        <div>
          <p className="eyebrow">지도</p>
          <h2 id="map-title" className="text-[22px] font-bold leading-tight text-heading">
            노선 지도
          </h2>
        </div>
        <p className="m-0 text-[13px] font-bold text-subtle">
          노선 선택과 검색 결과가 지도에 함께 표시됩니다.
        </p>
      </div>
      <div className="relative mx-4 mt-3.5 h-[360px] overflow-hidden rounded-[10px] border border-border min-[560px]:mx-[22px] min-[560px]:h-[480px] min-[1120px]:h-[690px]">
        <div className="h-full w-full" ref={containerRef} />
        {status === 'loading' && (
          <div className={`${overlayBase} bg-muted text-fg`} role="status">
            <span className="map-spinner" aria-hidden="true" />
            지도 불러오는 중…
          </div>
        )}
        {status === 'error' && (
          <div className={`${overlayBase} bg-danger-bg text-danger`} role="alert">
            {errorMessage} 카카오 콘솔 Web 플랫폼의 사이트 도메인 등록을 확인하세요.
          </div>
        )}
        {status === 'ready' && visibleRoutes.length === 0 && !userLocation && (
          <div className={`${overlayBase} bg-muted/85 text-fg`}>
            표시할 노선을 선택하거나 주소를 검색하세요.
          </div>
        )}
        {status === 'ready' && visibleRoutes.length > 0 && (
          <ul
            className="absolute bottom-3 left-3 z-[2] m-0 flex max-h-[116px] max-w-[calc(100%-24px)] list-none flex-wrap gap-x-3 gap-y-1 overflow-y-auto rounded-lg border border-border bg-surface/90 px-3 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.12)] [scrollbar-width:thin]"
            aria-label="표시 중 노선 범례"
          >
            {visibleRoutes.map((route) => (
              <li key={route.id} className="flex items-center gap-1.5 text-[12px] font-bold text-fg">
                <span
                  className="h-3 w-3 flex-none rounded-[3px]"
                  style={{ background: route.color }}
                  aria-hidden="true"
                />
                {route.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
