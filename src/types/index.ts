export const CATEGORIAS_INGRESO = [
  { value: 'ofrendas', label: 'Ofrendas' },
  { value: 'donaciones', label: 'Donaciones (Regalías)' },
  { value: 'actividades', label: 'Actividades' },
] as const

export const CATEGORIAS_EGRESO = [
  { value: 'vigilante', label: 'Vigilante' },
  { value: 'energia-electrica', label: 'Energía Eléctrica' },
  { value: 'agua', label: 'Agua' },
  { value: 'telefono', label: 'Teléfono/Internet' },
  { value: 'predicadores-invitados', label: 'Ofrenda para Predicadores Invitados' },
  { value: 'reparacion-instrumentos', label: 'Reparación de Instrumentos' },
  { value: 'equipo-aseo', label: 'Equipo de Aseo y Limpieza' },
  { value: 'compras-electricas', label: 'Compras de Bombillo, Cepos y Encendedores' },
  { value: 'alquiler-sillas', label: 'Alquiler de Sillas para Campañas' },
  { value: 'gasolina', label: 'Gasolina para Acarreos' },
  { value: 'ofrenda-pastores', label: 'Ofrenda para Reunión de Pastores' },
  { value: 'mano-obra', label: 'Mano de Obra para Reparaciones' },
  { value: 'agua-invitados', label: 'Compra de Agua para Invitados' },
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
  aprobadoPor?: string
  descripcion?: string
  fotoFactura?: string
  firmaTesorera?: string
  firmaSolicitante?: string
  firmaPastor?: string
  creadoEn: number
}

export interface PermisosSeccion {
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

export interface Permisos {
  caja: PermisosSeccion
  actividades: PermisosSeccion
  cultos: PermisosSeccion
  envivo: { ver: boolean; activar: boolean }
  usuarios: PermisosSeccion
}

export type UserRole = 'it-admin' | 'tesorero' | 'secretario' | 'visual'

export interface User {
  id: string
  username: string
  passwordHash: string
  nombre: string
  cargo: string
  role: UserRole
  permisos: Permisos
  activo: boolean
  creadoEn: number
}

export const ROLES_PRESET: Record<UserRole, Permisos> = {
  'it-admin': {
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    actividades: { ver: true, crear: true, editar: true, eliminar: true },
    cultos: { ver: true, crear: true, editar: true, eliminar: true },
    envivo: { ver: true, activar: true },
    usuarios: { ver: true, crear: true, editar: true, eliminar: true },
  },
  tesorero: {
    caja: { ver: true, crear: true, editar: true, eliminar: true },
    actividades: { ver: true, crear: false, editar: false, eliminar: false },
    cultos: { ver: true, crear: false, editar: false, eliminar: false },
    envivo: { ver: true, activar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
  },
  secretario: {
    caja: { ver: true, crear: false, editar: false, eliminar: false },
    actividades: { ver: true, crear: true, editar: true, eliminar: true },
    cultos: { ver: true, crear: true, editar: true, eliminar: true },
    envivo: { ver: true, activar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
  },
  visual: {
    caja: { ver: true, crear: false, editar: false, eliminar: false },
    actividades: { ver: true, crear: false, editar: false, eliminar: false },
    cultos: { ver: true, crear: false, editar: false, eliminar: false },
    envivo: { ver: true, activar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
  },
}
