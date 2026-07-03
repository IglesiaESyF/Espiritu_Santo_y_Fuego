import { db } from './firebase'
import { doc, setDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function trackVisit() {
  try {
    const dayKey = todayKey()
    const ref = doc(db, 'analytics', 'visitas')
    await setDoc(ref, {
      total: increment(1),
      [`dias.${dayKey}`]: increment(1),
      ultimaVisita: serverTimestamp(),
    }, { merge: true })
  } catch { /* silent */ }
}

export async function getVisitStats() {
  try {
    const ref = doc(db, 'analytics', 'visitas')
    const snap = await getDoc(ref)
    if (!snap.exists()) return { total: 0, hoy: 0, dias: {} }
    const data = snap.data()
    const dayKey = todayKey()
    return {
      total: data.total || 0,
      hoy: data.dias?.[dayKey] || 0,
      dias: data.dias || {},
    }
  } catch {
    return { total: 0, hoy: 0, dias: {} }
  }
}
