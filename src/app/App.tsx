import { Toaster } from 'sonner'
import { AuthProvider, QueryProvider } from './providers'
import AppRouter from './router'

export default function App() {
  return (
    <AuthProvider>
      <QueryProvider>
        <AppRouter />
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </AuthProvider>
  )
}
