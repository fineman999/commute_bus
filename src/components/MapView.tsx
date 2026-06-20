import { useEffect, useRef, useState } from 'react'
import { loadKakaoSdk } from '../lib/kakaoLoader'
import type { GeocodeResult } from '../lib/geocode'
import type { BusRoute, NearestResult } from '../types/route'

interface MapViewProps {
  route: BusRoute
  userLocation: GeocodeResult | null
  nearestResults: NearestResult[]
}

const WONJU_CENTER = { lat: 37.3422, lng: 127.9202 }

export function MapView({ route, userLocation, nearestResults }: MapViewProps) {
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

  // 노선/검색 상태가 바뀔 때마다 오버레이 다시 그림
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return

    const { maps } = window.kakao

    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = []
    const track = (overlay: KakaoOverlay) => overlaysRef.current.push(overlay)

    const bounds = new maps.LatLngBounds()
    const stops = route.stops.filter((stop) => stop.lat !== undefined && stop.lng !== undefined)
    const path = stops.map((stop) => new maps.LatLng(stop.lat!, stop.lng!))

    if (path.length > 1) {
      track(
        new maps.Polyline({
          path,
          strokeWeight: 5,
          strokeColor: route.color,
          strokeOpacity: 0.9,
          strokeStyle: 'solid',
          map,
        }),
      )
    }

    stops.forEach((stop) => {
      const position = new maps.LatLng(stop.lat!, stop.lng!)
      bounds.extend(position)
      track(
        new maps.CustomOverlay({
          position,
          content: `<span class="map-stop-dot" style="background:${route.color}"></span>`,
          map,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 2,
        }),
      )
      track(
        new maps.CustomOverlay({
          position,
          content: `<span class="map-stop-label">${stop.name}</span>`,
          map,
          xAnchor: 0.5,
          yAnchor: 0,
          zIndex: 2,
        }),
      )
    })

    if (userLocation) {
      const userPos = new maps.LatLng(userLocation.lat, userLocation.lng)
      bounds.extend(userPos)
      track(
        new maps.CustomOverlay({
          position: userPos,
          content: '<span class="map-user-pin">내 위치</span>',
          map,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 4,
        }),
      )

      nearestResults.forEach((result, index) => {
        if (result.stop.lat === undefined || result.stop.lng === undefined) return
        const stopPos = new maps.LatLng(result.stop.lat, result.stop.lng)
        bounds.extend(stopPos)
        track(
          new maps.Polyline({
            path: [userPos, stopPos],
            strokeWeight: 3,
            strokeColor: '#1e293b',
            strokeOpacity: 0.7,
            strokeStyle: 'shortdash',
            map,
          }),
        )
        track(
          new maps.CustomOverlay({
            position: stopPos,
            content: `<span class="map-rank-badge">${index + 1}</span>`,
            map,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 5,
          }),
        )
      })
    }

    if (stops.length > 0 || userLocation) {
      map.setBounds(bounds)
    }
  }, [route, userLocation, nearestResults, status])

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <div className="section-heading">
        <p className="eyebrow">지도</p>
        <h2 id="map-title">{route.name} 노선도</h2>
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
