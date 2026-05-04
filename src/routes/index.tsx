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
    <div className="min-h-screen bg-steel-200">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-medium text-steel-800 mb-1">hibiki</h1>
        <p className="text-sm text-steel-600 mb-8">
          Choose a category to start shadowing
        </p>
        <div className="space-y-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/category/$category"
              params={{ category: category.id }}
              className="block bg-steel-50 border border-steel-300 rounded-xl px-5 py-4 hover:border-steel-500 hover:bg-white transition-colors"
            >
              <p className="text-sm font-medium text-steel-800">
                {category.label}
              </p>
              <p className="text-sm text-steel-600 mt-1">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
