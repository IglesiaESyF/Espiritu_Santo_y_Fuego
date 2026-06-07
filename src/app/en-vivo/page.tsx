import { Flame, Youtube, Tv } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function EnVivoPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <Flame className="mx-auto mb-3 h-10 w-10 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold text-dark">En Vivo</h1>
          <p className="mt-2 text-gray-600">Transmisiones en vivo de nuestros cultos</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-6 flex h-48 w-full max-w-xl items-center justify-center rounded-xl bg-dark/5">
              <div className="text-center">
                <Youtube className="mx-auto mb-3 h-16 w-16 text-primary/60" />
                <p className="text-sm text-gray-500">
                  No hay transmisión en vivo en este momento
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Los cultos en vivo se transmiten los Domingos 10:00 AM y Miércoles 7:00 PM
                </p>
              </div>
            </div>
            <a
              href="https://www.youtube.com/@IglesiaEspirituSantoFuego"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg">
                <Youtube className="mr-2 h-5 w-5" /> Ir a YouTube
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Videos recientes placeholder */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-dark">
            <Tv className="h-5 w-5 text-primary" /> Videos Recientes
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-dark/5">
                    <Youtube className="h-10 w-10 text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-dark">Culto - Próximamente</h3>
                  <p className="text-xs text-gray-500">Fecha por confirmar</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
