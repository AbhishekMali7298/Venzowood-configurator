import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { Navbar } from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'DecorViz',
  description: 'Virtual Design Studio powered by canvas compositing',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-100 text-stone-900 antialiased">
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
