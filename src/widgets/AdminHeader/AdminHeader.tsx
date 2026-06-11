import { Menu, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { Button } from '@/shared/ui/button'

interface AdminHeaderProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onOpenMobileMenu: () => void
}

export default function AdminHeader({ collapsed, onToggleCollapse, onOpenMobileMenu }: AdminHeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-brand-cream px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileMenu}>
          <Menu />
          <span className="sr-only">Abrir menú</span>
        </Button>
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={onToggleCollapse}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
          <span className="sr-only">{collapsed ? 'Expandir menú' : 'Colapsar menú'}</span>
        </Button>
        <span className="text-lg font-semibold text-brand-brown">Trofeos Carrillon</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {user?.displayName || user?.email}
        </span>
        <Button variant="ghost" size="icon" onClick={() => logout()}>
          <LogOut />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  )
}
