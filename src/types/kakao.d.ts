// 카카오 지도 JavaScript SDK(maps + services)에서 실제로 쓰는 표면만 최소 타입화.
// 전체 SDK 타입이 아니라 geocode.ts / MapView.tsx가 의존하는 부분만 선언한다.
// 모듈 import/export가 없는 ambient 스크립트 파일이라 아래 타입은 전역에서 참조 가능.

type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR'

interface KakaoAddressResult {
  x: string
  y: string
  address_name: string
  road_address: { address_name: string } | null
}

interface KakaoPlaceResult {
  x: string
  y: string
  place_name: string
  address_name: string
  road_address_name: string
}

interface KakaoGeocoder {
  addressSearch(
    query: string,
    callback: (result: KakaoAddressResult[], status: KakaoStatus) => void,
  ): void
}

interface KakaoPlaces {
  keywordSearch(
    query: string,
    callback: (result: KakaoPlaceResult[], status: KakaoStatus) => void,
  ): void
}

interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void
}

interface KakaoMap {
  setBounds(bounds: KakaoLatLngBounds): void
  setCenter(latlng: KakaoLatLng): void
  setLevel(level: number): void
  getCenter(): KakaoLatLng
  relayout(): void
}

// Marker / Polyline / CustomOverlay 공통: 지도에 붙이고 떼는 인터페이스
interface KakaoOverlay {
  setMap(map: KakaoMap | null): void
}

interface KakaoMapOptions {
  center: KakaoLatLng
  level: number
}

interface KakaoMarkerOptions {
  position: KakaoLatLng
  map?: KakaoMap
  title?: string
  zIndex?: number
}

interface KakaoPolylineOptions {
  path: KakaoLatLng[]
  strokeWeight?: number
  strokeColor?: string
  strokeOpacity?: number
  strokeStyle?: string
  map?: KakaoMap
}

interface KakaoCustomOverlayOptions {
  position: KakaoLatLng
  content: string | HTMLElement
  map?: KakaoMap
  xAnchor?: number
  yAnchor?: number
  zIndex?: number
}

interface KakaoNamespace {
  maps: {
    load(callback: () => void): void
    Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    LatLngBounds: new () => KakaoLatLngBounds
    Marker: new (options: KakaoMarkerOptions) => KakaoOverlay
    Polyline: new (options: KakaoPolylineOptions) => KakaoOverlay
    CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoOverlay
    services: {
      Status: Record<KakaoStatus, KakaoStatus>
      Geocoder: new () => KakaoGeocoder
      Places: new () => KakaoPlaces
    }
  }
}

interface Window {
  kakao: KakaoNamespace
}
