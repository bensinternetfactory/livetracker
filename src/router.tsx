import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { routeTree } from './routeTree.gen'

function getConvexUrl() {
  if (typeof window !== 'undefined') {
    return (import.meta as any).env.VITE_CONVEX_URL
  }
  return process.env.CONVEX_URL || process.env.VITE_CONVEX_URL
}

export function getRouter() {
  const CONVEX_URL = getConvexUrl()

  if (!CONVEX_URL) {
    throw new Error('Missing CONVEX_URL environment variable. Set VITE_CONVEX_URL for client and CONVEX_URL for server.')
  }
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0, // Let React Query handle all caching
      defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
      defaultNotFoundComponent: () => <p>not found</p>,
    }),
    queryClient,
  )

  return router
}
