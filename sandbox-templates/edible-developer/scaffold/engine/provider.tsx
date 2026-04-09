import { createContext, useContext, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { engine } from './config'
import { EngineClient } from './sdk'

const EngineContext = createContext<EngineClient>(engine)

export function useEngine() {
  return useContext(EngineContext)
}

export function EngineProvider({ children }: { children: ReactNode }) {
  return (
    <EngineContext.Provider value={engine}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </EngineContext.Provider>
  )
}
