import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CineClub',
  description: 'Watch movies together',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
