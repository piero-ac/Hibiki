import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { tablesDB, account } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const PAGE_SIZE = 10

export const Route = createFileRoute('/category/$category')({
  beforeLoad: async () => {
    try {
      await account.get()
    } catch {
      throw redirect({ to: '/auth' })
    }
  },
  component: CategoryPage,
})

const difficulties = ['beginner', 'intermediate', 'advanced']

function CategoryPage() {
  const { category } = Route.useParams()
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracks', category, page],
    queryFn: () =>
      tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: 'tracks',
        queries: [
          Query.equal('category', category),
          Query.limit(PAGE_SIZE),
          Query.offset(page * PAGE_SIZE),
        ],
      }),
  })

  const tracks = data?.rows ?? []
  // const total = data?.total ?? 0
  // const totalPages = Math.ceil(total / PAGE_SIZE)

  if (isLoading)
    return (
      <div className="min-h-screen bg-steel-200">
        <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-steel-500">
          Loading...
        </div>
      </div>
    )

  if (isError)
    return (
      <div className="min-h-screen bg-steel-200">
        <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-red-500">
          Failed to load tracks
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-steel-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-medium text-steel-800 capitalize mb-8">
          {category}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {difficulties.map((difficulty) => {
            const filtered = tracks.filter(
              (t: any) => t.difficulty === difficulty,
            )
            return (
              <div key={difficulty}>
                <h2 className="text-xs uppercase tracking-wide text-steel-600 font-medium mb-3">
                  {difficulty}
                </h2>
                <div className="space-y-2">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-steel-500">No tracks</p>
                  ) : (
                    filtered.map((track: any) => (
                      <Link
                        key={track.$id}
                        to="/player/$trackId"
                        params={{ trackId: track.$id }}
                        className="block bg-steel-50 border border-steel-300 rounded-xl px-4 py-3 hover:border-steel-500 hover:bg-white transition-colors"
                      >
                        <p className="text-sm font-medium text-steel-800">
                          {track.title}
                        </p>
                        <p className="text-xs text-steel-500 mt-1">
                          {track.duration}s
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
