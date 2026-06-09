# Shared — Infraestructura reutilizable

## shared/api — Cliente HTTP

```ts
// shared/api/client.ts
import { getAuth } from 'firebase/auth'

const BASE_URL = import.meta.env.VITE_API_URL

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuth().currentUser?.getIdToken()

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

  return res.json() as Promise<T>
}
```

## shared/api — por entidad

```ts
// shared/api/articulos.api.ts
import { apiClient } from './client'
import type { Articulo, InsertArticulo, UpdateArticulo } from '../lib/types'

export const articulosApi = {
  list: (params?: { proveedorId?: string }) =>
    apiClient<{ data: Articulo[] }>(`/v1/articulos${params?.proveedorId ? `?proveedorId=${params.proveedorId}` : ''}`),

  getById: (id: string) =>
    apiClient<{ data: Articulo }>(`/v1/articulos/${id}`),

  create: (data: InsertArticulo) =>
    apiClient<{ data: Articulo }>('/v1/articulos', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateArticulo) =>
    apiClient<{ data: Articulo }>(`/v1/articulos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiClient<void>(`/v1/articulos/${id}`, { method: 'DELETE' }),

  actualizarPreciosMasivo: (proveedorId: string, porcentaje: number) =>
    apiClient<{ data: { actualizados: number } }>(`/v1/articulos/proveedor/${proveedorId}/precios`, {
      method: 'PATCH',
      body: JSON.stringify({ porcentaje }),
    }),
}
```

## shared/config — Firebase

```ts
// shared/config/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
```
