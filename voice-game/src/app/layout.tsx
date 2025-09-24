import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Voice Mini Game',
  description: 'A modern Next.js application using Bun.',
  keywords: ['Next.js', 'Bun', 'TypeScript', 'shadcn/ui', 'React'],
  authors: [{ name: '' }],
  creator: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className={inter.variable}>
      <body className='min-h-screen bg-background font-sans antialiased'>
        <div className='relative flex min-h-screen flex-col'>
          <div className='flex-1'>{children}</div>
        </div>
      </body>
    </html>
  )
}
