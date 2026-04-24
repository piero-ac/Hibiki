import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { account } from '@/lib/appwrite'
import { useLogin, useSignup } from '@/hooks/useAuth'

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    try {
      await account.get()
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-medium text-center mb-8">hibiki</h1>

        <div className="flex mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 pb-2 text-sm border-b-2 transition-colors ${mode === 'signin' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 pb-2 text-sm border-b-2 transition-colors ${mode === 'signup' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error.message}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {isPending
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
