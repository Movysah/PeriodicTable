import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

type LocalStorageState<T> = [T, Dispatch<SetStateAction<T>>]

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): LocalStorageState<T> {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore browser privacy mode and storage quota errors.
    }
  }, [key, value])

  return [value, setValue]
}
