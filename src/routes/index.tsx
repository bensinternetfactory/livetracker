import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Finance Terms
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Mobile-first finance terms presentation with real-time collaboration
        </p>

        <div className="flex flex-col gap-4">
          <a
            href="/rep"
            className="block w-full py-3 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Rep Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
