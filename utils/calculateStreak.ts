export function calculateStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0

  const days = new Set(
    sessions.map((s) => new Date(s.completedAt).toLocaleDateString()),
  )

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toLocaleDateString()

    if (days.has(dateStr)) {
      streak++
    } else if (i > 1) {
      // allow missing today (i === 0) or yesterday being the last day (i === 1)
      break
    }
  }

  return streak
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
