import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PT Inti Nusa Dinamika Optima - Portal Staff',
    short_name: 'INDO Portal',
    description:
      'Portal staff untuk POS transaksi, service, stok, keuangan, dan proyek PT Inti Nusa Dinamika Optima.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
