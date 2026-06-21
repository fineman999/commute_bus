import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// GitHub Pages 프로젝트 페이지는 /<repo>/ 하위에서 서빙되므로 빌드 시 base를 맞춘다.
// 개발 서버(dev)는 루트('/')로 둬서 localhost 접속을 단순하게 유지한다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/commute_bus/' : '/',
  plugins: [react(), tailwindcss()],
}))
