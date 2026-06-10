import { createBrowserRouter, RouterProvider } from 'react-router-dom'

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
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
