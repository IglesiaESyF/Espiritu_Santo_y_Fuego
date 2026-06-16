const repo = 'Espiritu_Santo_y_Fuego'

export default function imageLoader({ src }: { src: string }) {
  if (src.startsWith('http') || src.startsWith('//')) return src
  if (src.startsWith('/' + repo)) return src
  return '/' + repo + src
}
