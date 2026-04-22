import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { account } from '@/lib/appwrite'
import { useLogout } from '@/hooks/useAuth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      const user = await account.get()
      return { user }
    } catch {
      throw redirect({ to: '/auth' })
    }
  },
  component: Home,
})

function Home() {
  const { user } = Route.useRouteContext()
  const logout = useLogout()
  const router = useRouter()

  async function handleLogout() {
    await logout.mutateAsync()
    router.navigate({ to: '/auth' })
  }

  return (
    <div className="p-8 max-w-sm">
      <h1 className="text-xl font-medium mb-4">Account</h1>
      <div className="space-y-2 text-sm text-gray-600 mb-6">
        <p>
          <span className="text-black font-medium">Name</span>: {user.name}
        </p>
        <p>
          <span className="text-black font-medium">Email</span>: {user.email}
        </p>
        <p>
          <span className="text-black font-medium">ID</span>: {user.$id}
        </p>
        <p>
          <span className="text-black font-medium">Joined</span>:{' '}
          {new Date(user.$createdAt).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={handleLogout}
        disabled={logout.isPending}
        className="text-sm text-red-500 disabled:opacity-50"
      >
        {logout.isPending ? 'Logging out...' : 'Log out'}
      </button>
    </div>
  )
}
