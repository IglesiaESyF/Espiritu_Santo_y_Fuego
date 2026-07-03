import { db } from './firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

async function getAdminLocation(): Promise<string> {
  try {
    const res = await fetch('https://ip-api.com/json/?fields=city,regionName,country', { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return ''
    const data = await res.json()
    return [data.city, data.regionName, data.country].filter(Boolean).join(', ')
  } catch {
    return ''
  }
}

export async function auditLog(section: string, accion: string, usuario: string, detalle?: string) {
  try {
    const ciudad = await getAdminLocation()
    await addDoc(collection(db, 'auditoria'), {
      seccion: section,
      accion,
      usuario,
      detalle: detalle || '',
      ubicacion: ciudad,
      timestamp: serverTimestamp(),
    })
  } catch { /* silent */ }
}
