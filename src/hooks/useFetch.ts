import { useEffect, useState } from 'react'

type FetchState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export function useFetch<T>(url: string): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async (): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const payload = (await response.json()) as T
        setData(payload)
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') {
          return
        }

        if (reason instanceof Error) {
          setError(reason.message)
          return
        }

        setError('Unknown loading error')
      } finally {
        setLoading(false)
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [url])

  return { data, loading, error }
}
