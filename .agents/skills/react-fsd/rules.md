# React FSD — Reglas

## Reglas fundamentales

1. Respetar el flujo de importaciones: nunca importar hacia arriba ni entre slices del mismo nivel.
2. Cada slice tiene su `index.ts` que define la API pública — solo importar desde el index, nunca desde archivos internos.
3. Un componente = un archivo. Sin componentes gigantes con 300 líneas.
4. Server state con React Query. Sin estado global para datos del servidor.
5. Formularios con React Hook Form + Zod resolver — los mismos schemas del backend cuando aplique.

## DO (Prácticas requeridas)

### Componentes
- PascalCase para componentes: `ArticuloForm.tsx`
- camelCase para hooks: `useArticulos.ts`
- Tipar todas las props con TypeScript — sin `any`.
- Exportar por defecto el componente principal del archivo.

### Estado y datos
- React Query para toda comunicación con la API.
- `queryKey` como array descriptivo: `['articulos', { proveedorId }]`.
- `invalidateQueries` en `onSuccess` de mutations para refrescar listas.
- Estado local (`useState`) solo para UI: modales, tabs, inputs controlados.

### Formularios
- React Hook Form + Zod resolver en todos los formularios.
- Mostrar errores de validación inline en cada campo.
- Deshabilitar el botón submit mientras `isSubmitting`.

### UI/UX
- Mobile-first. Revisar en 390px antes de dar algo por terminado.
- Loading states con Skeleton — nunca pantalla en blanco.
- Errores con Toast — nunca alert().
- Confirmaciones destructivas con Dialog de confirmación.
- Usar las variables CSS de la paleta Carrillon para colores institucionales.

## DO NOT

- No importar desde rutas internas de otro slice: `import { algo } from '../features/articulos/components/Form'` — usar el index.
- No mezclar lógica de negocio en componentes de UI.
- No usar `useEffect` para sincronizar estado derivado — calcularlo en render.
- No `console.log` en código commiteado.
- No estilos inline — usar clases Tailwind o variables CSS.
