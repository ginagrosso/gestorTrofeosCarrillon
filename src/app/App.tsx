import { Toaster } from 'sonner'
import { QueryProvider } from './providers'
import AppRouter from './router'

export default function App() {
  return (
    <QueryProvider>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </QueryProvider>
  )
}
