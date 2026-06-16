import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, Lock } from 'lucide-react'
import logoSrc from '@/../public/logo.png'

export function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="logo-wrapper"><Image src={logoSrc} alt="IESFuego" width={28} height={28} className="logo-spin h-7 w-7 object-contain brightness-0 invert" /></span>
              <span className="text-lg font-bold">IESFuego</span>
            </div>
            <p className="text-sm text-gray-400">
              Iglesia Espíritu Santo Fuego — Transformando vidas con el poder del Espíritu Santo.
            </p>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary-light">
              <MapPin className="h-4 w-4" /> Dirección
            </h3>
            <p className="text-sm text-gray-400">
              Gasolinera Uno Tipitapa. 10c 1/2 al Oeste.<br />
              Tipitapa, Nicaragua
            </p>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary-light">
              <Phone className="h-4 w-4" /> Contacto
            </h3>
            <p className="space-y-1 text-sm text-gray-400">
              <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> 8438-6180 / 8321-2177</span>
              <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> iglesiamadreesf@gmail.com</span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          <Link href="/login" className="flex items-center gap-1 text-gray-500 hover:text-primary-light transition-colors">
            <Lock className="h-3 w-3" /> Administración
          </Link>
          <p>© {new Date().getFullYear()} Iglesia Espíritu Santo Fuego. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
