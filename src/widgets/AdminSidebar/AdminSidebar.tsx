import { NavLink } from 'react-router-dom'
import { Package, Truck, Users, ShoppingBag, Receipt, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const NAV_ITEMS = [
  { to: '/articulos', label: 'Artículos', icon: Package },
  { to: '/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/productos', label: 'Productos', icon: ShoppingBag },
  { to: '/ventas', label: 'Ventas', icon: Receipt },
  { to: '/importar-exportar', label: 'Importar/Exportar', icon: FileSpreadsheet },
] as const

interface AdminSidebarProps {
  collapsed?: boolean
  onNavigate?: () => void
}

export default function AdminSidebar({ collapsed = false, onNavigate }: AdminSidebarProps) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-brown text-brand-cream'
                : 'text-brand-brown hover:bg-brand-cream',
              collapsed && 'justify-center',
            )
          }
        >
          <Icon className="size-5 shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
