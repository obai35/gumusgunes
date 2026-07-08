import { db } from '@/lib/db'
import { GroqContentGenerator } from './groq-content'
import { startScheduler } from './scheduler'

const generator = new GroqContentGenerator()

export async function activateCampaign(campaignId: string) {
  const campaign = await db.socialCampaign.findUnique({
    where: { id: campaignId },
    include: { posts: true },
  })
  if (!campaign || campaign.status !== 'active') return

  if (campaign.triggerType === 'scheduled' && campaign.triggerConfig) {
    const config = campaign.triggerConfig as any
    const interval = config.intervalDays || 7
    await scheduleRecurringPosts(campaign, interval)
  }

  startScheduler()
}

async function scheduleRecurringPosts(
  campaign: { id: string; name: string; goal: string },
  intervalDays: number,
) {
  const products = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 5,
  })

  const accounts = await db.socialAccount.findMany({ where: { isActive: true } })
  if (accounts.length === 0 || products.length === 0) return

  for (let i = 0; i < 4; i++) {
    const product = products[i % products.length]
    const account = accounts[i % accounts.length]
    const scheduledAt = new Date()
    scheduledAt.setDate(scheduledAt.getDate() + (i + 1) * intervalDays)

    const content = await generator.generatePost(
      {
        name: product.name,
        description: product.description,
        material: product.material,
        price: product.price,
        tags: JSON.parse(product.tags || '[]'),
      },
      'feed',
      'promotional',
    )

    await db.socialPost.create({
      data: {
        accountId: account.id,
        campaignId: campaign.id,
        platform: account.platform,
        postType: 'feed',
        status: 'scheduled',
        mediaUrls: JSON.stringify([product.imageUrl]),
        caption: content.caption,
        hashtags: JSON.stringify(content.hashtags),
        productIds: JSON.stringify([product.id]),
        scheduledAt,
      },
    })
  }
}
