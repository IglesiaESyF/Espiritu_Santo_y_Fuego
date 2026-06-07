import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DollarSign, Tv, CalendarDays, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: DollarSign, label: 'Caja', value: 'RD$ 0.00', color: 'text-green-600', bg: 'bg-green-100' },
          { icon: TrendingUp, label: 'Ingresos del Mes', value: 'RD$ 0.00', color: 'text-blue-600', bg: 'bg-blue-100' },
          { icon: CalendarDays, label: 'Actividades', value: '0', color: 'text-amber-600', bg: 'bg-amber-100' },
          { icon: Tv, label: 'Cultos', value: '0', color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-dark">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-dark">Bienvenido al Panel de Administración</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Desde aquí puedes gestionar las actividades, cultos y la caja de la iglesia.
              Usa el menú lateral para navegar entre las secciones.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
