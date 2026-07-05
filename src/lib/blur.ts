import blurMap from '@/lib/blur-map.json'

export function getBlurDataUrl(imageUrl: string): string | undefined {
  if (!imageUrl || imageUrl.startsWith('http')) return undefined
  return (blurMap as Record<string, string>)[imageUrl]
}
