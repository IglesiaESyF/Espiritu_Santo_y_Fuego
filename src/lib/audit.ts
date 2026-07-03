import { db } from './firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function auditLog(section: string, accion: string, usuario: string, detalle?: string) {
  try {
    await addDoc(collection(db, 'auditoria'), {
      seccion: section,
      accion,
      usuario,
      detalle: detalle || '',
      timestamp: serverTimestamp(),
    })
  } catch { /* silent */ }
}
