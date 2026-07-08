let intervalId: ReturnType<typeof setInterval> | null = null

export function startScheduler() {
  if (intervalId) return
  intervalId = setInterval(async () => {
    try {
      const { db } = await import('@/lib/db')
      const now = new Date()
      const due = await db.socialPost.findMany({
        where: { status: 'scheduled', scheduledAt: { lte: now } },
        include: { account: true },
      })
      for (const post of due) {
        await db.socialPost.update({
          where: { id: post.id },
          data: { status: 'published', publishedAt: now },
        })
      }
    } catch {
      // silent
    }
  }, 60_000)
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
