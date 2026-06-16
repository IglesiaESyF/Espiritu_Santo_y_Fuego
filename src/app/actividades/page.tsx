'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

interface Actividad {
  id?: string
  titulo: string
  descripcion: string
  fecha: string
  hora: string
  lugar: string
}

export default function ActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([])

  useEffect(() => {
    loadActividades()
  }, [])

  async function loadActividades() {
    try {
      const q = query(collection(db, 'actividades'), orderBy('createdAt', 'desc'))
      const snap = await Promise.race([
        getDocs(q),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ])
      const list: Actividad[] = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() as Actividad }))
      setActividades(list)
    } catch {}
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-dark">Actividades</h1>
          <p className="mt-2 text-gray-600">Calendario de actividades de la iglesia</p>
        </div>

        <div className="space-y-4">
          {actividades.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p>No hay actividades registradas aún.</p>
              </CardContent>
            </Card>
          ) : (
            actividades.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-6">
                  <h2 className="mb-3 text-xl font-bold text-dark">{a.titulo}</h2>
                  {a.descripcion && <p className="mb-3 text-sm text-gray-600">{a.descripcion}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {a.fecha && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> {a.fecha}</span>}
                    {a.hora && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {a.hora}</span>}
                    {a.lugar && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {a.lugar}</span>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
