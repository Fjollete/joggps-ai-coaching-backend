import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JogGPS AI Coaching Backend',
  description: 'Self-hosted AI coaching API for the JogGPS running tracker app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}