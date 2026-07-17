import { useQuery } from '@tanstack/react-query'
import { productosApi } from '@/shared/api/productos.api'
import { compararAlfabetico } from '@/shared/lib/sort'

export const useProductos = () =>
  useQuery({
    queryKey: ['productos'],
    queryFn:  () => productosApi.list(),
    select:   res => [...res.data].sort((a, b) => compararAlfabetico(a.descripcion, b.descripcion)),
  })
