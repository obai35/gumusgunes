import type { PostInsights, AccountInsights, TrendPoint, Comment, HashtagSuggestion } from './types'

const META_GRAPH_URL = 'https://graph.facebook.com/v22.0'

export class MetaClient {
  private token: string

  constructor(accessToken: string) {
    this.token = accessToken
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${META_GRAPH_URL}${path}${path.includes('?') ? '&' : '?'}access_token=${this.token}`
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(`Meta API error: ${err.error?.message || res.statusText}`)
    }
    return res.json()
  }

  // ——— Pages ———

  async getPages(): Promise<{ id: string; name: string; category: string }[]> {
    const data = await this.fetch<{ data: any[] }>('/me/accounts?fields=id,name,category')
    return data.data
  }

  async getInstagramAccounts(pageId: string): Promise<{ id: string; username: string }[]> {
    const data = await this.fetch<{ data: any[] }>(`/${pageId}/instagram_accounts?fields=id,username`)
    return data.data
  }

  // ——— Posts ———

  async createFeedPost(pageId: string, mediaUrl: string, caption: string): Promise<{ id: string; permalink?: string }> {
    const data = await this.fetch<{ id: string }>(`/${pageId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ url: mediaUrl, caption }),
    })
    return data
  }

  async createCarouselPost(pageId: string, mediaUrls: string[], caption: string): Promise<{ id: string }> {
    const children: string[] = []
    for (const url of mediaUrls) {
      const child = await this.fetch<{ id: string }>(`/${pageId}/photos`, {
        method: 'POST',
        body: JSON.stringify({ url, published: false }),
      })
      children.push(child.id)
    }
    const data = await this.fetch<{ id: string }>(`/${pageId}/feed`, {
      method: 'POST',
      body: JSON.stringify({
        message: caption,
        attached_media: children.map(id => ({ media_fbid: id })),
      }),
    })
    return data
  }

  async createReel(pageId: string, videoUrl: string, caption: string): Promise<{ id: string }> {
    const data = await this.fetch<{ id: string }>(`/${pageId}/video_reels`, {
      method: 'POST',
      body: JSON.stringify({ video_url: videoUrl, description: caption }),
    })
    return data
  }

  async publishToInstagram(igAccountId: string, mediaUrl: string, caption: string): Promise<{ id: string }> {
    const container = await this.fetch<{ id: string }>(`/${igAccountId}/media`, {
      method: 'POST',
      body: JSON.stringify({ image_url: mediaUrl, caption }),
    })
    const published = await this.fetch<{ id: string }>(`/${igAccountId}/media_publish`, {
      method: 'POST',
      body: JSON.stringify({ creation_id: container.id }),
    })
    return published
  }

  async publishCarouselToInstagram(igAccountId: string, mediaUrls: string[], caption: string): Promise<{ id: string }> {
    const children: string[] = []
    for (const url of mediaUrls) {
      const child = await this.fetch<{ id: string }>(`/${igAccountId}/media`, {
        method: 'POST',
        body: JSON.stringify({ image_url: url, is_carousel_item: true }),
      })
      children.push(child.id)
    }
    const container = await this.fetch<{ id: string }>(`/${igAccountId}/media`, {
      method: 'POST',
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: children.join(','),
        caption,
      }),
    })
    const published = await this.fetch<{ id: string }>(`/${igAccountId}/media_publish`, {
      method: 'POST',
      body: JSON.stringify({ creation_id: container.id }),
    })
    return published
  }

  // ——— Comments ———

  async getComments(postId: string): Promise<Comment[]> {
    const data = await this.fetch<{ data: any[] }>(`/${postId}/comments?fields=id,from{id,username},message,created_time,comment_count`)
    return data.data.map(c => ({
      id: c.id,
      from: c.from,
      message: c.message,
      timestamp: c.created_time,
      replyCount: c.comment_count || 0,
    }))
  }

  async replyToComment(commentId: string, message: string): Promise<void> {
    await this.fetch(`/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }

  // ——— Insights ———

  async getPostInsights(postId: string): Promise<PostInsights> {
    const data = await this.fetch<{ data: any[] }>(
      `/${postId}/insights?metric=likes,comments,shares,saved,reach,impressions`
    )
    const result: any = { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 }
    for (const m of data.data) {
      if (m.values?.[0]?.value != null) {
        const key = m.name === 'saved' ? 'saves' : m.name
        result[key] = m.values[0].value
      }
    }
    result.engagement = result.likes + result.comments + result.shares + result.saves
    return result as PostInsights
  }

  async getAccountInsights(igAccountId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<AccountInsights> {
    const metrics = 'follower_count,profile_views,reach,impressions'
    const data = await this.fetch<{ data: any[] }>(
      `/${igAccountId}/insights?metric=${metrics}&period=${period}`
    )
    const result: any = { followerCount: 0, followerGrowth: 0, profileViews: 0, reach: 0, impressions: 0 }
    for (const m of data.data) {
      if (m.values?.[0]?.value != null) {
        const key = m.name === 'follower_count' ? 'followerCount'
          : m.name === 'profile_views' ? 'profileViews' : m.name
        result[key] = m.values[0].value
      }
    }
    return result as AccountInsights
  }

  async getReachTrend(igAccountId: string, days = 30): Promise<TrendPoint[]> {
    const since = Math.floor(Date.now() / 1000) - days * 86400
    const data = await this.fetch<{ data: any[] }>(
      `/${igAccountId}/insights?metric=reach&period=day&since=${since}`
    )
    return (data.data[0]?.values || []).map((v: any) => ({
      date: v.end_time?.split('T')[0] || '',
      value: v.value || 0,
    }))
  }

  // ——— Hashtag Search ———

  async searchHashtags(query: string): Promise<HashtagSuggestion[]> {
    const data = await this.fetch<{ data: any[] }>(
      `/ig_hashtag_search?user_id=me&q=${encodeURIComponent(query)}`
    )
    return data.data.map(h => ({
      name: h.name,
      count: h.media_count || 0,
      mediaCount: h.media_count || 0,
    }))
  }

  // ——— Boost/Ads ———

  async boostPost(postId: string, pageId: string, budget: number, days: number): Promise<{ adId: string }> {
    const data = await this.fetch<{ id: string }>(`/act_${pageId}/ads`, {
      method: 'POST',
      body: JSON.stringify({
        name: `Boosted Post ${postId}`,
        object_id: postId,
        lifecycle_events: ['ACTIVE'],
        status: 'ACTIVE',
        creative: { object_id: postId },
        targeting: {},
        bid_amount: Math.round(budget * 100),
        daily_budget: Math.round((budget / days) * 100),
      }),
    })
    return { adId: data.id }
  }
}
