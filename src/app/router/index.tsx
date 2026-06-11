import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProveedoresPage from '@/pages/proveedores/ProveedoresPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <h1 className="text-2xl font-semibold text-brand-brown">
          Trofeos Carrillon
        </h1>
      </div>
    ),
  },
  {
    path: '/proveedores',
    element: <ProveedoresPage />,
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
