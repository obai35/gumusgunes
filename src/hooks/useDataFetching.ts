'use client'

import { useState, useEffect, useCallback } from 'react'

type UseDataFetchingResult<T> = {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDataFetching<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
): UseDataFetchingResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refresh: fetch }
}
