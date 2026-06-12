import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { importarApi } from '@/shared/api/importar.api'
import type { ImportResult } from '@/shared/lib/types'

const useImportar = (
  mutationFn: (registros: unknown[]) => Promise<{ data: ImportResult }>,
  queryKey: string,
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: [queryKey] })
      const resumen = `${data.creados} creados, ${data.actualizados} actualizados`
      if (data.errores.length > 0) {
        toast.warning(`${resumen}, ${data.errores.length} con errores`)
      } else {
        toast.success(resumen)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useImportarProveedores = () => useImportar(importarApi.proveedores, 'proveedores')
export const useImportarClientes = () => useImportar(importarApi.clientes, 'clientes')
export const useImportarArticulos = () => useImportar(importarApi.articulos, 'articulos')
export const useImportarProductos = () => useImportar(importarApi.productos, 'productos')
