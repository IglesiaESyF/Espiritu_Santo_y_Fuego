/** @type {import('next').NextConfig} */
const repo = 'WebApp-para-la-Iglesia-Esp-ritu-Santo-Fuego'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/' + repo,
  assetPrefix: '/' + repo,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
}

export default nextConfig
