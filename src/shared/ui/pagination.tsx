import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {totalItems === 0 ? 'Sin resultados' : `Mostrando ${from}-${to} de ${totalItems}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Siguiente
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
