import { Redis } from '@upstash/redis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return null as unknown as Redis
  }
  return new Redis({ url, token })
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
