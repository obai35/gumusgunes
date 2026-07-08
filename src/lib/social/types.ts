export type Platform = 'instagram' | 'facebook'
export type PostType = 'feed' | 'reel' | 'story' | 'carousel'
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'

export type PostInsights = {
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  engagement: number
}

export type AccountInsights = {
  followerCount: number
  followerGrowth: number
  profileViews: number
  reach: number
  impressions: number
}

export type TrendPoint = {
  date: string
  value: number
}

export type Comment = {
  id: string
  from: { id: string; username: string }
  message: string
  timestamp: string
  replyCount: number
}

export type HashtagSuggestion = {
  name: string
  count: number
  mediaCount: number
}
