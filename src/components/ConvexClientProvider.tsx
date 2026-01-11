import { ConvexProvider } from 'convex/react'
import { ConvexReactClient } from 'convex/react'
import { useState, type ReactNode } from 'react'

function getConvexUrl() {
  if (typeof window !== 'undefined') {
    return (import.meta as any).env.VITE_CONVEX_URL
  }
  return process.env.CONVEX_URL || process.env.VITE_CONVEX_URL
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convexClient] = useState(() => {
    const url = getConvexUrl()
    if (!url) {
      throw new Error('Missing CONVEX_URL')
    }
    return new ConvexReactClient(url)
  })

  return (
    <ConvexProvider client={convexClient}>
      {children}
    </ConvexProvider>
  )
}
