import { db } from './firebase'
import { doc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

let lastLocation = ''

export function setLastLocation(loc: string) {
  lastLocation = loc
}

async function fetchLocation(): Promise<string> {
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
    const ref = await addDoc(collection(db, 'auditoria'), {
      seccion: section,
      accion,
      usuario,
      detalle: detalle || '',
      ubicacion: lastLocation,
      timestamp: serverTimestamp(),
    })
    if (!lastLocation) {
      fetchLocation().then(loc => {
        if (loc) updateDoc(doc(db, 'auditoria', ref.id), { ubicacion: loc })
      })
    }
  } catch { /* silent */ }
}
