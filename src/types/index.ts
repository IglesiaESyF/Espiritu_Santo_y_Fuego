export const CATEGORIAS_INGRESO = [
  { value: 'ofrendas', label: 'Ofrendas' },
  { value: 'donaciones', label: 'Donaciones (Regalías)' },
  { value: 'actividades', label: 'Actividades' },
] as const

export const CATEGORIAS_EGRESO = [
  { value: 'luz', label: 'Electricidad' },
  { value: 'agua', label: 'Agua' },
  { value: 'telefono', label: 'Teléfono/Internet' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'evento', label: 'Gasto de Evento' },
  { value: 'actividades', label: 'Actividades' },
  { value: 'otro', label: 'Otro' },
] as const

export interface MovimientoCaja {
  id: string
  tipo: 'ingreso' | 'egreso'
  categoria: string
  monto: number
  concepto: string
  fecha: string
  ingresadoPor: string
  descripcion?: string
  fotoFactura?: string
  firmaTesorera?: string
  firmaSolicitante?: string
  firmaPastor?: string
  creadoEn: number
}
