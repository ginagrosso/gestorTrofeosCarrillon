// Coordenadas en mm desde la esquina superior izquierda (A4: 210×297mm).
// Calibradas por medición directa contra la plantilla física de Premios & Homenajes (MEPB).
// La plantilla de MAD (Trofeos Siglo XXI) puede tener un diseño distinto — si es así, hay
// que medirla por separado y agregar un segundo set de coordenadas seleccionable por empresa.
//
// El número de comprobante NO se imprime: cada hoja de la plantilla preimpresa ya trae su
// propio número de imprenta — el numero del sistema es solo registro interno.
export const OVERLAY = {
  fecha:            { x: 145, y: 22 },
  clienteNombre:    { x: 13,  y: 52 },
  clienteDireccion: { x: 13,  y: 58 },
  clienteLocalidad: { x: 110, y: 58 },
  clienteSitIva:    { x: 13,  y: 64 },
  clienteCuit:      { x: 90,  y: 64 },
  condVenta:        { x: 140, y: 64 },
  observaciones:    { x: 13,  y: 70 },
  tabla: {
    startY:   99,      // Y de la primera fila de ítems (bajado 1 rowHeight: a 93mm pisaba el encabezado impreso)
    rowHeight: 6,       // alto de cada fila en mm (no hay renglones marcados, valor estimado)
    cols: {
      cant:        13,  // alineado con el margen izquierdo de los datos del cliente (13mm)
      codigo:      25,
      descripcion: 45,
      precio:      140,
      bonif:       163,
      subtotal:    178,
    },
  },
  total: { x: 150, y: 225 },
} as const
