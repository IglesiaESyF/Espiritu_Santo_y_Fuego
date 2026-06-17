import { MovimientoCaja } from '@/types'
import { db } from './firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'

const COLLECTION = 'caja-movimientos'

export async function getMovimientos(): Promise<MovimientoCaja[]> {
  const q = query(collection(db, COLLECTION), orderBy('fecha', 'desc'))
  const snap = await getDocs(q)
  const list: MovimientoCaja[] = []
  snap.forEach((d) => {
    const data = d.data()
    list.push({
      id: d.id,
      tipo: data.tipo,
      categoria: data.categoria,
      monto: data.monto,
      concepto: data.concepto,
      fecha: data.fecha,
      ingresadoPor: data.ingresadoPor,
      aprobadoPor: data.aprobadoPor,
      descripcion: data.descripcion,
      fotoFactura: data.fotoFactura,
      firmaTesorera: data.firmaTesorera,
      firmaSolicitante: data.firmaSolicitante,
      firmaPastor: data.firmaPastor,
      creadoEn: data.creadoEn?.toMillis?.() || data.creadoEn || 0,
    })
  })
  return list
}

export async function saveMovimiento(m: MovimientoCaja) {
  const { id, ...data } = m
  await addDoc(collection(db, COLLECTION), { ...data, creadoEn: serverTimestamp() })
}

export async function deleteMovimiento(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}
