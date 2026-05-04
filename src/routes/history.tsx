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
      return { userId: user.$id, isAnonymous: !user.email }
    } catch {
      throw redirect({ to: '/auth' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { userId, isAnonymous } = Route.useRouteContext()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sessions', userId],
    queryFn: () => {
      if (isAnonymous) {
        const sessions = JSON.parse(
          localStorage.getItem('hibiki-sessions') ?? '[]',
        )
        return { rows: sessions, total: sessions.length }
      }
      return tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: 'sessions',
        queries: [
          Query.equal('userId', userId),
          Query.orderDesc('completedAt'),
          Query.limit(10),
        ],
      })
    },
  })

  const sessions = data?.rows ?? []
  const streak = calculateStreak(sessions)

  if (isLoading)
    return (
      <div className="min-h-screen bg-steel-200">
        <div className="max-w-lg mx-auto px-4 py-8 text-sm text-steel-500">
          Loading...
        </div>
      </div>
    )

  if (isError)
    return (
      <div className="min-h-screen bg-steel-200">
        <div className="max-w-lg mx-auto px-4 py-8 text-sm text-red-500">
          Failed to load history
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-steel-200">
      <div className="max-w-lg mx-auto px-4 py-8">
        {isAnonymous && (
          <div className="bg-steel-50 border border-steel-300 rounded-xl px-4 py-3 text-sm text-steel-600 mb-6">
            You are browsing as a guest. Your history is saved locally and will
            be lost if you clear your browser data.
          </div>
        )}

        {/* Streak */}
        <div className="bg-steel-50 border border-steel-300 rounded-xl p-6 text-center mb-6">
          <p className="text-5xl font-medium text-steel-800 mb-1">{streak}</p>
          <p className="text-sm text-steel-500">day streak 🔥</p>
          <p className="text-xs text-steel-400 mt-1">
            {sessions.length} total sessions
          </p>
        </div>

        {/* Sessions */}
        <h2 className="text-xs uppercase tracking-wide text-steel-500 font-medium mb-3">
          Recent sessions
        </h2>

        {sessions.length === 0 ? (
          <p className="text-sm text-steel-500">
            No sessions yet. Complete a track to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session: any) => (
              <div
                key={session.$id ?? session.id}
                className="bg-steel-50 border border-steel-300 rounded-xl px-4 py-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-steel-800">
                      {session.trackTitle}
                    </p>
                    <p className="text-xs text-steel-400 mt-1">
                      {formatDate(session.completedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-steel-800">
                      {session.rating} / 5
                    </p>
                    <p className="text-xs text-steel-400">rating</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
