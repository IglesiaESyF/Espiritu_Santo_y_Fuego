function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const intro = [
  'Te invitamos a',
  'Te esperamos para',
  'No te pierdas',
  'Prepárate para',
  'Ven y sé parte de',
  'Es tiempo de',
  'Te convocamos a',
]

const templates: Record<string, { pre: string[], body: string[], post: string[] }> = {
  adoracion: {
    pre: ['un tiempo especial de adoración', 'una noche de alabanza y adoración', 'un ambiente de gloria y honra a Dios'],
    body: ['donde entregaremos nuestro corazón al Señor', 'para exaltar Su nombre', 'para buscar Su presencia', 'para declarar que Él es Rey'],
    post: ['trae a tu familia y vive esta experiencia', 'no falte nadie, Dios nos espera', 'sé parte de este mover espiritual'],
  },
  oracion: {
    pre: ['una cadena de oración poderosa', 'un tiempo de guerra espiritual', 'una noche de oración e intercesión'],
    body: ['donde Dios se moverá con poder', 'y verás Su mano obrar en tu vida', 'y entregaremos cada carga al Señor'],
    post: ['trae tus peticiones y saldrás bendecido', 'Dios escucha el clamor de Su pueblo', 'lo que ates en la tierra será atado en los cielos'],
  },
  estudio: {
    pre: ['un estudio bíblico revelador', 'una enseñanza que transformará tu vida', 'una palabra profética para tu vida'],
    body: ['donde profundizaremos en la Palabra', 'entendiendo los misterios de Dios', 'descubriendo la verdad que nos hace libres'],
    post: ['trae tu Biblia y un corazón dispuesto', 'aprenderás cosas nuevas del Reino', 'Dios te hablará directamente'],
  },
  jovenes: {
    pre: ['un evento especial para jóvenes', 'una reunión juvenil con propósito', 'un encuentro de jóvenes apasionados por Dios'],
    body: ['donde descubrirás tu identidad en Cristo', 'para vivir una juventud con propósito', 'para impactar tu generación'],
    post: ['invita a tus amigos, la iglesia eres tú', 'música, palabra y mucha gloria', 'tu lugar está aquí'],
  },
  general: {
    pre: ['una actividad especial de la iglesia', 'un encuentro con el Espíritu Santo', 'una cita con Dios que no puedes perder'],
    body: ['Dios se moverá de una manera especial', 'verás Su gloria manifestada', 'experimentarás un avivamiento'],
    post: ['abre tu corazón y recibe lo que Dios tiene para ti', 'todos están invitados, Dios te espera', 'prepárate para vivir algo sobrenatural'],
  },
  mujer: {
    pre: ['un encuentro especial para mujeres', 'una reunión de mujeres de fe', 'un tiempo de ministerio de mujeres'],
    body: ['fortaleciendo tu corazón y tu espíritu', 'descubriendo el propósito de Dios para ti', 'renovándote en la presencia del Señor'],
    post: ['trae a una amiga y comparte esta bendición', 'Dios tiene una palabra especial para ti', 'no hay nada como estar en Su presencia'],
  },
  evangelismo: {
    pre: ['una jornada de evangelismo y amor', 'una campaña de fe y esperanza', 'una cruzada de salvación'],
    body: ['para llevar el mensaje de salvación', 'compartiendo el amor de Cristo con nuestra comunidad', 'sembrando la semilla del Reino'],
    post: ['trae a alguien que necesite de Dios', 'sé luz en medio de las tinieblas', 'juntos alcanzaremos almas para Cristo'],
  },
}

function detectCategory(title: string): string {
  const t = title.toLowerCase()
  if (/adorac?i[oó]n|alabanza|gloria|himnos|cantos/.test(t)) return 'adoracion'
  if (/orac?i[oó]n|intercesi[oó]n|clamor|plegaria/.test(t)) return 'oracion'
  if (/estudio|bibl|palabra|enseñanza|discipul/.test(t)) return 'estudio'
  if (/j[oó]ven|juventud|adolescent/.test(t)) return 'jovenes'
  if (/mujer|dama|femenil/.test(t)) return 'mujer'
  if (/evangel|cruzad|campaña|misi[oó]n/.test(t)) return 'evangelismo'
  return 'general'
}

const sufijos = [
  'Dios te bendiga, te esperamos.',
  '¡Te esperamos con los brazos abiertos!',
  'Ven y verás la gloria de Dios.',
  'No te lo pierdas, Dios te está llamando.',
  'Tu vida cambiará, atrévete a venir.',
  'Dios tiene una sorpresa preparada para ti.',
]

export function generarDescripcion(titulo: string): string {
  if (!titulo.trim()) return ''
  const cat = detectCategory(titulo)
  const t = templates[cat]
  const p = pick(t.pre)
  const b = pick(t.body)
  const n = pick(t.post)
  const i = pick(intro)
  const s = pick(sufijos)
  return `${i} ${p} ${b}. ${n}. ${s}`
}
