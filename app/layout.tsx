import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eventraka — Nigeria Event Intelligence',
  description: 'Discover and track professional events across Nigeria',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
