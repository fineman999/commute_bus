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

  // 창 크기가 바뀌면 지도를 컨테이너에 다시 맞춘다(relayout 안 하면 깨짐)
  useEffect(() => {
    function handleResize() {
      const map = mapRef.current
      if (!map) return
      const center = map.getCenter()
      map.relayout()
      map.setCenter(center)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <div className="section-heading">
        <p className="eyebrow">지도</p>
        <h2 id="map-title">노선 지도</h2>
      </div>
      {status === 'error' && (
        <div className="empty-state">
          {errorMessage} 카카오 콘솔 Web 플랫폼의 사이트 도메인 등록을 확인하세요.
        </div>
      )}
      <div className="map-view" ref={containerRef} />
    </section>
  )
}
