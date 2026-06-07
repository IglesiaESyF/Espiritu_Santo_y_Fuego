export const CATEGORIAS_INGRESO = [
  { value: 'diezmo', label: 'Diezmo' },
  { value: 'ofrenda', label: 'Ofrenda' },
  { value: 'donacion', label: 'Donación' },
  { value: 'evento', label: 'Evento Especial' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'otro', label: 'Otro' },
] as const

export const CATEGORIAS_EGRESO = [
  { value: 'luz', label: 'Electricidad' },
  { value: 'agua', label: 'Agua' },
  { value: 'telefono', label: 'Teléfono/Internet' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'salario', label: 'Salario/Pastor' },
  { value: 'evento', label: 'Gasto de Evento' },
  { value: 'otro', label: 'Otro' },
] as const

export interface MovimientoCaja {
  id: string
  tipo: 'ingreso' | 'egreso'
  categoria: string
  monto: number
  concepto: string
  descripcion?: string
  fecha: string
  creadoEn: number
}
