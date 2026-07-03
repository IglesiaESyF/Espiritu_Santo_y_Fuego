/** @type {import('next').NextConfig} */
const repo = 'Espiritu_Santo_y_Fuego'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/' + repo,
  assetPrefix: '/' + repo,
  env: { NEXT_PUBLIC_BASE_PATH: '/' + repo },
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
}

export default nextConfig
