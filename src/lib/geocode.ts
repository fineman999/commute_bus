import { loadKakaoSdk } from './kakaoLoader'

// 지오코딩 결과는 provider(카카오)와 무관한 형태로 정규화한다.
// nearest 계산(findNearest)은 이 타입에만 의존하고 카카오 SDK는 알지 못한다.
export interface GeocodeResult {
  lat: number
  lng: number
  label: string
  address: string
}

// 주소 → 좌표. 먼저 주소 검색(Geocoder), 결과가 없으면 장소 키워드 검색(Places)으로 폴백.
// "단구초등학교" 같은 명칭은 주소 검색이 비고 키워드 검색이 맞는 경우가 많다.
export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  await loadKakaoSdk()
  const { services } = window.kakao.maps

  const byAddress = await new Promise<GeocodeResult[]>((resolve) => {
    new services.Geocoder().addressSearch(trimmed, (result, status) => {
      if (status !== services.Status.OK) {
        resolve([])
        return
      }
      resolve(
        result.map((item) => ({
          lat: Number(item.y),
          lng: Number(item.x),
          label: item.address_name,
          address: item.road_address?.address_name ?? item.address_name,
        })),
      )
    })
  })

  if (byAddress.length > 0) return byAddress

  return new Promise<GeocodeResult[]>((resolve) => {
    new services.Places().keywordSearch(trimmed, (result, status) => {
      if (status !== services.Status.OK) {
        resolve([])
        return
      }
      resolve(
        result.map((item) => ({
          lat: Number(item.y),
          lng: Number(item.x),
          label: item.place_name,
          address: item.road_address_name || item.address_name,
        })),
      )
    })
  })
}
