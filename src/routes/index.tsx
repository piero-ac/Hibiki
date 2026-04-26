import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { account } from '@/lib/appwrite'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      await account.get()
    } catch {
      throw redirect({ to: '/auth' })
    }
  },
  component: Home,
})

const categories = [
  {
    id: 'interview',
    label: 'Interview',
    description: 'Real conversations with Japanese speakers',
  },
  {
    id: 'podcast',
    label: 'Podcast',
    description: 'Natural spoken Japanese from podcasts',
  },
]

function Home() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-xl font-medium mb-2">hibiki</h1>
      <p className="text-sm text-gray-500 mb-8">
        Choose a category to start shadowing
      </p>

      <div className="space-y-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            to="/category/$category"
            params={{ category: category.id }}
            className="block border border-gray-200 rounded-lg px-4 py-4 hover:border-gray-400 transition-colors"
          >
            <p className="text-sm font-medium">{category.label}</p>
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
