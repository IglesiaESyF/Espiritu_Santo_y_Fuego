'use client'

import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'

export interface PortadaConfig {
  imagenUrl: string
  actualizadoPor?: string
  actualizadoEn?: number
}

export const PORTADA_DOC = doc(db, 'configuracion', 'portada')

export async function getPortada(): Promise<PortadaConfig | null> {
  try {
    const snap = await getDoc(PORTADA_DOC)
    if (snap.exists()) return snap.data() as PortadaConfig
  } catch {}
  return null
}

export async function savePortada(cfg: PortadaConfig): Promise<void> {
  await setDoc(PORTADA_DOC, cfg)
}

export async function deletePortada(): Promise<void> {
  await deleteDoc(PORTADA_DOC)
}
