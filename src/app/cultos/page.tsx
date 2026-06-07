import { Tv, CalendarDays, Clock, MapPin, User } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'

const cultos = [
  {
    titulo: 'Culto de Fe y Esperanza',
    predicador: 'Pastor',
    fecha: 'Domingo',
    hora: '10:00 AM',
    lugar: 'Templo Principal',
    descripcion: 'Un tiempo de adoración, palabra y ministerio.',
  },
  {
    titulo: 'Culto de Oración',
    predicador: 'Pastor',
    fecha: 'Miércoles',
    hora: '7:00 PM',
    lugar: 'Templo Principal',
    descripcion: 'Oración e intercesión por la iglesia y la comunidad.',
  },
  {
    titulo: 'Culto Juvenil',
    predicador: 'Líder Juvenil',
    fecha: 'Viernes',
    hora: '7:00 PM',
    lugar: 'Salón Juvenil',
    descripcion: 'Un espacio para los jóvenes con palabra dinámica y alabanza.',
  },
]

export default function CultosPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <Tv className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-dark">Cultos</h1>
          <p className="mt-2 text-gray-600">Conoce nuestros horarios de culto</p>
        </div>

        <div className="space-y-4">
          {cultos.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <h2 className="mb-3 text-xl font-bold text-dark">{c.titulo}</h2>
                <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-primary" /> {c.fecha}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" /> {c.hora}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> {c.lugar}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" /> {c.predicador}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{c.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
