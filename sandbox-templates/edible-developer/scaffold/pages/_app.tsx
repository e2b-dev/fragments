import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { EngineProvider } from '@/engine'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <EngineProvider>
      <Component {...pageProps} />
    </EngineProvider>
  )
}
