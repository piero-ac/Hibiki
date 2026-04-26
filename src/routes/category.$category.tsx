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
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (isLoading)
    return <div className="px-4 py-8 text-sm text-gray-500">Loading...</div>
  if (isError)
    return (
      <div className="px-4 py-8 text-sm text-red-500">
        Failed to load tracks
      </div>
    )

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-xl font-medium capitalize mb-6">{category}</h1>

      {tracks.length === 0 ? (
        <p className="text-sm text-gray-500">No tracks found</p>
      ) : (
        <div className="space-y-3">
          {tracks.map((track: any) => (
            <Link
              key={track.$id}
              // to="/player/$trackId"
              // params={{ trackId: track.$id }}
              to="/"
              className="block border border-gray-200 rounded-lg px-4 py-4 hover:border-gray-400 transition-colors"
            >
              <p className="text-sm font-medium">{track.title}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs text-gray-400 capitalize">
                  {track.difficulty}
                </span>
                <span className="text-xs text-gray-400">{track.duration}s</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="text-sm text-gray-500 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="text-sm text-gray-500 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
