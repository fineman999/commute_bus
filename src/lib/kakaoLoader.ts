// 카카오 지도 SDK(services 라이브러리)를 런타임에 1회만 동적 로드한다.
// JS 키는 클라이언트 노출 전제(도메인 화이트리스트로 보호) — VITE_KAKAO_JS_KEY 사용.
let loadPromise: Promise<void> | null = null

const SDK_SCRIPT_ID = 'kakao-maps-sdk'

export function loadKakaoSdk(): Promise<void> {
  if (loadPromise) return loadPromise

  const appKey = import.meta.env.VITE_KAKAO_JS_KEY
  if (!appKey) {
    return Promise.reject(
      new Error('VITE_KAKAO_JS_KEY가 설정되지 않았습니다. .env.local을 확인하세요.'),
    )
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SDK_SCRIPT_ID)
    if (existing) {
      window.kakao.maps.load(() => {
        resolve()
      })
      return
    }

    const script = document.createElement('script')
    script.id = SDK_SCRIPT_ID
    script.async = true
    // autoload=false → 스크립트 로드 후 kakao.maps.load 로 명시 초기화
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`
    script.addEventListener('load', () => {
      window.kakao.maps.load(() => {
        resolve()
      })
    })
    script.addEventListener('error', () => {
      loadPromise = null
      reject(
        new Error('카카오 지도 SDK 로드에 실패했습니다. 네트워크 또는 도메인 등록을 확인하세요.'),
      )
    })
    document.head.appendChild(script)
  })

  return loadPromise
}
