import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Autonomous Document Intelligence',
  description: 'Transform unstructured documents into structured intelligence using our mystery-solving agents',
}

// Import the client component
import MainLayout from './main-layout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: "Home", href: "/" },
    // { label: "Case Files", href: "/case" },
    { label: "Upload", href: "/upload" },
    { label: "Dataset", href: "/dataset" },
    { label: "About", href: "/about" }
  ];

  return (
    <html lang="en">
      <ClerkProvider>
        <body className={`${inter.className} relative overflow-x-hidden`}>
          {/* Use the client component for interactive elements */}
          <MainLayout navItems={navItems}>
            {children}
          </MainLayout>
        </body>
      </ClerkProvider>
    </html>
  )
}