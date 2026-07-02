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
              <span className="flex items-center gap-2"><Phone className="h-3 w-3" /> 8438-6180</span>
              <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> iglesiamadreesf@gmail.com</span>
            </p>
          </div>
        </div>

        {/* redes sociales */}
        <div className="mt-10 border-t border-gray-700 pt-8">
          <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-gray-400">
            Síguenos en redes
          </h3>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              {
                label: 'TikTok',
                url: 'https://www.tiktok.com/@iglesiespiritusantofuego',
                color: 'hover:text-pink-400',
              },
              {
                label: 'Facebook',
                url: 'https://www.facebook.com/share/1JSRzrAzj8/',
                color: 'hover:text-blue-400',
              },
              {
                label: 'WhatsApp',
                url: 'https://whatsapp.com/channel/0029VbCNnE9545v4iiTJOV3Q',
                color: 'hover:text-green-400',
              },
            ].map(social => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center gap-2 text-gray-400 transition-colors ${social.color}`}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(social.url)}`}
                  alt={`QR ${social.label}`}
                  className="h-28 w-28 rounded-xl bg-white/10 p-1 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl"
                />
                <span className="mt-1 text-sm font-semibold">{social.label}</span>
                <span className="max-w-[160px] text-center text-[10px] leading-tight text-gray-500">
                  Escanea el código o da click en el enlace
                </span>
              </a>
            ))}
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
