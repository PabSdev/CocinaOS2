import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import '@/_app/styles/globals.css'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' })

export const rootMetadata: Metadata = {
  title: {
    default: 'CocinaOS | Inventario de Cocina Profesional',
    template: '%s | CocinaOS',
  },
  description: 'Gestión y control del inventario de una cocina profesional.',
  icons: {
    icon: '/brand/cocinaos.ico',
    shortcut: '/brand/cocinaos.ico',
    apple: '/brand/cocinaos.svg',
  },
}

export function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`h-full font-sans antialiased ${figtree.variable}`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
