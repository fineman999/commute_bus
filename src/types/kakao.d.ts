// 카카오 지도 JavaScript SDK(services 라이브러리)에서 실제로 쓰는 표면만 최소 타입화.
// 전체 SDK 타입이 아니라 geocode.ts가 의존하는 부분만 선언한다.
export {}

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

interface KakaoNamespace {
  maps: {
    load(callback: () => void): void
    services: {
      Status: Record<KakaoStatus, KakaoStatus>
      Geocoder: new () => KakaoGeocoder
      Places: new () => KakaoPlaces
    }
  }
}

declare global {
  interface Window {
    kakao: KakaoNamespace
  }
}
