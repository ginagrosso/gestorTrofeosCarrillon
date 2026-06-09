# Pages — Composición por ruta

Las páginas solo componen — no tienen lógica propia.

## Estructura

```
pages/
├── articulos/
│   ├── ArticulosPage.tsx        # lista + filtros
│   └── ArticuloDetallePage.tsx  # detalle/edición
├── clientes/
├── proveedores/
├── productos/
├── ventas/
└── auth/
    └── LoginPage.tsx
```

## Ejemplo de página

```tsx
// pages/articulos/ArticulosPage.tsx
import { useState } from 'react'
import { ArticulosTable } from '@/widgets/ArticulosTable'
import { ArticuloForm } from '@/features/articulos'
import { ActualizarPreciosModal } from '@/features/articulos'
import { Button } from '@/shared/ui'

export default function ArticulosPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <header>
        <h1>Artículos</h1>
        <Button onClick={() => setShowForm(true)}>Nuevo artículo</Button>
      </header>

      <ArticulosTable />

      {showForm && (
        <ArticuloForm onSuccess={() => setShowForm(false)} />
      )}
    </div>
  )
}
```

## Router (app/router.tsx)

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedLayout } from '@/app/layouts/ProtectedLayout'
import LoginPage          from '@/pages/auth/LoginPage'
import ArticulosPage      from '@/pages/articulos/ArticulosPage'
import ClientesPage       from '@/pages/clientes/ClientesPage'
import ProveedoresPage    from '@/pages/proveedores/ProveedoresPage'
import ProductosPage      from '@/pages/productos/ProductosPage'
import VentasPage         from '@/pages/ventas/VentasPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/',            element: <ArticulosPage /> },
      { path: '/articulos',   element: <ArticulosPage /> },
      { path: '/clientes',    element: <ClientesPage /> },
      { path: '/proveedores', element: <ProveedoresPage /> },
      { path: '/productos',   element: <ProductosPage /> },
      { path: '/ventas',      element: <VentasPage /> },
    ],
  },
])
```
