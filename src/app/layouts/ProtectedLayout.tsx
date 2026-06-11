import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { Skeleton } from '@/shared/ui/skeleton'

export default function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
