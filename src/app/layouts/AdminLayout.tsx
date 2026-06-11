import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from '@/widgets/AdminSidebar'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { cn } from '@/shared/lib/utils'

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-brand-cream">
      <aside
        className={cn(
          'hidden shrink-0 border-r border-border bg-background transition-all duration-200 md:flex md:flex-col',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        <AdminSidebar collapsed={collapsed} />
      </aside>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4">
            <SheetTitle className="text-brand-brown">Trofeos Carrillon</SheetTitle>
          </SheetHeader>
          <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
