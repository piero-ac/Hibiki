import { Link, useRouter } from '@tanstack/react-router'
import { useLogout, useUser } from '@/hooks/useAuth'

export function Navigation() {
  const logout = useLogout()
  const router = useRouter()
  const { data: user } = useUser()
  const isAnonymous = user && !user.email

  async function handleLogout() {
    await logout.mutateAsync()
    router.navigate({ to: '/auth' })
  }

  return (
    <>
      <nav className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-sm font-medium">
          hibiki
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            Home
          </Link>
          <Link
            to="/history"
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            History
          </Link>
          {user?.labels.includes('admin') && (
            <Link
              to="/admin"
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              Admin
            </Link>
          )}
          {!isAnonymous && (
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="text-sm text-red-500 disabled:opacity-50"
            >
              {logout.isPending ? 'Logging out...' : 'Log out'}
            </button>
          )}
        </div>
      </nav>
      {isAnonymous && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-center">
          <p className="text-xs text-gray-500">
            You are browsing as a guest. Your history is saved locally and will
            be lost if you clear your browser data.
          </p>
        </div>
      )}
    </>
  )
}
