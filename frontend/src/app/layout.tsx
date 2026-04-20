import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '../i18n/LanguageContext'

export const metadata: Metadata = {
  title: 'Rayyan',
  description: 'Rayyan application built with Next.js and Express',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}