import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'

const actividades = [
  {
    titulo: 'Escuela Bíblica Dominical',
    fecha: 'Cada Domingo',
    hora: '9:00 AM',
    lugar: 'Templo Principal',
    descripcion: 'Estudio sistemático de la Palabra de Dios para todas las edades.',
  },
  {
    titulo: 'Grupos de Hogar',
    fecha: 'Cada Jueves',
    hora: '7:00 PM',
    lugar: 'Hogares de Miembros',
    descripcion: 'Reuniones en casas para compartir la palabra y fortalecer la comunión.',
  },
  {
    titulo: 'Ayuno y Oración',
    fecha: 'Primer Sábado del Mes',
    hora: '8:00 AM - 12:00 PM',
    lugar: 'Templo Principal',
    descripcion: 'Jornada de ayuno, oración y búsqueda de Dios.',
  },
]

export default function ActividadesPage() {
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
          {actividades.map((a, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <h2 className="mb-3 text-xl font-bold text-dark">{a.titulo}</h2>
                <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-primary" /> {a.fecha}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" /> {a.hora}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> {a.lugar}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{a.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
