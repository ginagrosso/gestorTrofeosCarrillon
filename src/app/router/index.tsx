import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ProtectedLayout from '@/app/layouts/ProtectedLayout'
import AdminLayout from '@/app/layouts/AdminLayout'
import LoginPage from '@/pages/auth/LoginPage'
import ArticulosPage from '@/pages/articulos/ArticulosPage'
import ProveedoresPage from '@/pages/proveedores/ProveedoresPage'
import ClientesPage from '@/pages/clientes/ClientesPage'
import ClienteDetailPage from '@/pages/clientes/ClienteDetailPage'
import ProductosPage from '@/pages/productos/ProductosPage'
import VentasPage from '@/pages/ventas/VentasPage'
import ComprasPage from '@/pages/compras/ComprasPage'
import PresupuestosPage from '@/pages/presupuestos/PresupuestosPage'
import ConfiguracionPage from '@/pages/configuracion/ConfiguracionPage'

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
          { path: '/clientes/:id', element: <ClienteDetailPage /> },
          { path: '/productos', element: <ProductosPage /> },
          { path: '/ordenes', element: <VentasPage /> },
          { path: '/compras', element: <ComprasPage /> },
          { path: '/presupuestos', element: <PresupuestosPage /> },
          { path: '/configuracion', element: <ConfiguracionPage /> },
        ],
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
