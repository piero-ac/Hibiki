import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { tablesDB, account } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { calculateStreak, formatDate } from 'utils/calculateStreak'

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID

export const Route = createFileRoute('/history')({
  beforeLoad: async () => {
    try {
      const user = await account.get()
      return { userId: user.$id }
    } catch {
      throw redirect({ to: '/auth' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { userId } = Route.useRouteContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sessions', userId],
    queryFn: () =>
      tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: 'sessions',
        queries: [
          Query.equal('userId', userId),
          Query.orderDesc('completedAt'),
          Query.limit(100),
        ],
      }),
  })

  const sessions = data?.rows ?? []
  const streak = calculateStreak(sessions)

  if (isLoading)
    return <div className="px-4 py-8 text-sm text-gray-500">Loading...</div>
  if (isError)
    return (
      <div className="px-4 py-8 text-sm text-red-500">
        Failed to load history
      </div>
    )

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* Streak */}
      <div className="border border-gray-200 rounded-xl p-6 text-center mb-8">
        <p className="text-5xl font-medium mb-1">{streak}</p>
        <p className="text-sm text-gray-500">day streak 🔥</p>
        <p className="text-xs text-gray-400 mt-1">
          {sessions.length} total sessions
        </p>
      </div>

      {/* Sessions */}
      <h2 className="text-sm font-medium mb-4">Recent sessions</h2>

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">
          No sessions yet. Complete a track to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => (
            <div
              key={session.$id}
              className="border border-gray-200 rounded-lg px-4 py-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{session.trackTitle}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(session.completedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{session.rating} / 5</p>
                  <p className="text-xs text-gray-400">rating</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
