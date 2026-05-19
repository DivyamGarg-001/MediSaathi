'use client'

import type React from "react"
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/contexts/auth-context'
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>MediSaathi - Your Smart Health Companion</title>
        <meta
          name="description"
          content="Connect patients, doctors, and hospitals with AI-powered healthcare management. Manage family health records, book appointments, and access AI medical insights."
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
