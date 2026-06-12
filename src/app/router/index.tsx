import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProtectedLayout from '@/app/layouts/ProtectedLayout'
import AdminLayout from '@/app/layouts/AdminLayout'
import LoginPage from '@/pages/auth/LoginPage'
import ArticulosPage from '@/pages/articulos/ArticulosPage'
import ProveedoresPage from '@/pages/proveedores/ProveedoresPage'
import ClientesPage from '@/pages/clientes/ClientesPage'
import ProductosPage from '@/pages/productos/ProductosPage'
import VentasPage from '@/pages/ventas/VentasPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <ArticulosPage /> },
          { path: '/articulos', element: <ArticulosPage /> },
          { path: '/proveedores', element: <ProveedoresPage /> },
          { path: '/clientes', element: <ClientesPage /> },
          { path: '/productos', element: <ProductosPage /> },
          { path: '/ventas', element: <VentasPage /> },
        ],
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
