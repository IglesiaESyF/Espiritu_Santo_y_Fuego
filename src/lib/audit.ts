import { db } from './firebase'
import { doc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

let lastLocation = ''

export function setLastLocation(loc: string) {
  lastLocation = loc
}

async function fetchLocation(): Promise<string> {
  const providers = [
    async () => {
      const r = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(3000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.city) throw new Error()
      return [d.city, d.region, d.country].filter(Boolean).join(', ')
    },
    async () => {
      const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.city) throw new Error()
      return [d.city, d.region, d.country_name].filter(Boolean).join(', ')
    },
    async () => {
      const r = await fetch('https://ip-api.com/json/?fields=city,regionName,country', { signal: AbortSignal.timeout(3000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.city) throw new Error()
      return [d.city, d.regionName, d.country].filter(Boolean).join(', ')
    },
  ]
  for (const fn of providers) {
    try { return await fn() } catch { /* next */ }
  }
  return ''
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
