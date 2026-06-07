export interface Actividad {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  hora: string
  lugar: string
  imagen?: string
  createdAt: number
}

export interface Culto {
  id: string
  titulo: string
  predicador: string
  fecha: string
  hora: string
  descripcion: string
  videoUrl?: string
  imagen?: string
  createdAt: number
}

export interface Transaccion {
  id: string
  tipo: 'ingreso' | 'egreso'
  concepto: string
  monto: number
  categoria: string
  fecha: string
  descripcion?: string
  registradoPor: string
  createdAt: number
}

export interface CajaResumen {
  totalIngresos: number
  totalEgresos: number
  saldo: number
  periodo: string
}

export type CategoriaIngreso =
  | 'diezmo'
  | 'ofrenda'
  | 'donacion'
  | 'evento'
  | 'alquiler'
  | 'otro'

export type CategoriaEgreso =
  | 'luz'
  | 'agua'
  | 'internet'
  | 'sonido'
  | 'transporte'
  | 'alimentacion'
  | 'mantenimiento'
  | 'ofrenda_especial'
  | 'otro'

export const CATEGORIAS_INGRESO: { value: CategoriaIngreso; label: string }[] = [
  { value: 'diezmo', label: 'Diezmo' },
  { value: 'ofrenda', label: 'Ofrenda' },
  { value: 'donacion', label: 'Donación' },
  { value: 'evento', label: 'Evento' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'otro', label: 'Otro' },
]

export const CATEGORIAS_EGRESO: { value: CategoriaEgreso; label: string }[] = [
  { value: 'luz', label: 'Luz' },
  { value: 'agua', label: 'Agua' },
  { value: 'internet', label: 'Internet' },
  { value: 'sonido', label: 'Sonido' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'ofrenda_especial', label: 'Ofrenda Especial' },
  { value: 'otro', label: 'Otro' },
]

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
