import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { account } from '@/lib/appwrite'
import { useLogin, useSignup } from '@/hooks/useAuth'

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    try {
      const user = await account.get()
      if (!user.email) return
      throw redirect({ to: '/' })
    } catch (e) {
      if (e instanceof Response) throw e
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const navigate = useNavigate()
  const login = useLogin()
  const signup = useSignup()

  const isPending = login.isPending || signup.isPending
  const error = login.error || signup.error

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      if (mode === 'signin') {
        await login.mutateAsync({ email, password })
      } else {
        await signup.mutateAsync({ email, password, name })
      }
      navigate({ to: '/' })
    } catch {
      // login.error already has the error, nothing extra needed here
    }
  }

  async function handleGuest() {
    try {
      await account.createAnonymousSession()
      navigate({ to: '/' })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-steel-700">
      <div className="w-full max-w-sm bg-steel-50 rounded-xl border border-steel-400 p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-medium text-steel-800">hibiki</h1>
          <p className="text-sm text-steel-500 mt-1">language shadowing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-steel-300 bg-white text-steel-800 outline-none focus:border-steel-600"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-steel-300 bg-white text-steel-800 outline-none focus:border-steel-600"
            />
          </div>

          {login.isError && (
            <p className="text-sm text-red-500">{login.error.message}</p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-steel-800 text-steel-50 disabled:opacity-50"
          >
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-steel-200" />
          <span className="text-xs text-steel-400">or</span>
          <div className="flex-1 h-px bg-steel-200" />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          className="w-full py-2.5 text-sm font-medium rounded-lg bg-steel-100 border border-steel-300 text-steel-700"
        >
          Continue as guest
        </button>

        <p className="text-xs text-center text-steel-500 mt-4">
          Guest sessions are saved locally and cleared on logout.
        </p>
      </div>
    </div>
  )
}
