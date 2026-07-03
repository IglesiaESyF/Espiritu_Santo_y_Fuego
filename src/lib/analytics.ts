import { db } from './firebase'
import { doc, setDoc, addDoc, collection, getDocs, increment, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore'
import { setLastLocation } from './audit'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function getLocation(): Promise<{ ciudad: string; pais: string; region: string } | null> {
  const providers = [
    async () => {
      const r = await fetch('https://ip-api.com/json/?fields=city,country,regionName', { signal: AbortSignal.timeout(4000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.city) throw new Error()
      return { ciudad: d.city, pais: d.country, region: d.regionName }
    },
    async () => {
      const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.city) throw new Error()
      return { ciudad: d.city, pais: d.country_name, region: d.region }
    },
    async () => {
      const r = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(4000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.city) throw new Error()
      return { ciudad: d.city, pais: d.country, region: d.region }
    },
  ]
  for (const fn of providers) {
    try { return await fn() } catch { /* next */ }
  }
  return null
}

export async function trackVisit() {
  try {
    const dayKey = todayKey()
    const monthKeyVal = monthKey()

    // contador global (histórico)
    await setDoc(doc(db, 'analytics', 'visitas'), {
      total: increment(1),
      [`dias.${dayKey}`]: increment(1),
      ultimaVisita: serverTimestamp(),
    }, { merge: true })

    // contador mensual (se reinicia cada mes)
    await setDoc(doc(db, 'analytics', `mes_${monthKeyVal}`), {
      total: increment(1),
      [`dias.${dayKey}`]: increment(1),
    }, { merge: true })

    // ubicaciones frecuentes (acumulativo, nunca se reinicia)
    const loc = await getLocation()
    if (loc?.ciudad) {
      setLastLocation([loc.ciudad, loc.region, loc.pais].filter(Boolean).join(', '))
      const ciudadKey = loc.ciudad.replace(/\s+/g, '_').toLowerCase()
      await setDoc(doc(db, 'analytics', 'ubicaciones'), {
        [`ciudades.${ciudadKey}`]: increment(1),
        [`ultima_visita.${ciudadKey}`]: serverTimestamp(),
      }, { merge: true })
    }

    // detalle de visita
    await addDoc(collection(db, 'visitas_recientes'), {
      timestamp: serverTimestamp(),
      fecha: dayKey,
      pagina: window.location.pathname,
      ciudad: loc?.ciudad || 'Desconocido',
      pais: loc?.pais || '',
      region: loc?.region || '',
      userAgent: navigator.userAgent.slice(0, 100),
    })
  } catch { /* silent */ }
}

export async function getVisitStats() {
  try {
    const ref = doc(db, 'analytics', 'visitas')
    const snap = await getDoc(ref)
    if (!snap.exists()) return { total: 0, hoy: 0, mes: 0, dias: {} }
    const data = snap.data()
    const dayKey = todayKey()
    const monthKeyVal = monthKey()

    // get monthly count
    let mes = 0
    try {
      const mesRef = doc(db, 'analytics', `mes_${monthKeyVal}`)
      const mesSnap = await getDoc(mesRef)
      if (mesSnap.exists()) mes = mesSnap.data().total || 0
    } catch { /* ignore */ }

    return {
      total: data.total || 0,
      hoy: data.dias?.[dayKey] || 0,
      mes,
      dias: data.dias || {},
    }
  } catch {
    return { total: 0, hoy: 0, mes: 0, dias: {} }
  }
}

export async function getUbicaciones() {
  try {
    const ref = doc(db, 'analytics', 'ubicaciones')
    const snap = await getDoc(ref)
    if (!snap.exists()) return { ciudades: {}, ultima_visita: {} }
    const data = snap.data()
    return {
      ciudades: data.ciudades || {},
      ultima_visita: data.ultima_visita || {},
    }
  } catch {
    return { ciudades: {}, ultima_visita: {} }
  }
}

export async function getVisitasRecientes(lim = 50) {
  try {
    const col = collection(db, 'visitas_recientes')
    const { query, orderBy, limit, getDocs } = await import('firebase/firestore')
    const snap = await getDocs(query(col, orderBy('timestamp', 'desc'), limit(lim)))
    const list: Record<string, unknown>[] = []
    snap.forEach(d => list.push({ id: d.id, ...d.data() }))
    return list
  } catch {
    return []
  }
}

export async function resetMonthlyCounter() {
  try {
    const mk = monthKey()
    await deleteDoc(doc(db, 'analytics', `mes_${mk}`))
  } catch { /* silent */ }
}

export async function clearVisitasRecientes() {
  try {
    const col = collection(db, 'visitas_recientes')
    const snap = await getDocs(col)
    const promises: Promise<void>[] = []
    snap.forEach(d => promises.push(deleteDoc(doc(db, 'visitas_recientes', d.id))))
    await Promise.all(promises)
  } catch { /* silent */ }
}
