import { auth } from '../config'

const BASE_URL = import.meta.env.VITE_API_URL

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await auth.currentUser?.getIdToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error ?? 'Error desconocido')
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
