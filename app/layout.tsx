import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PostHogProvider } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Artifacts by E2B',
  description: 'About Hackable open-source version of Anthropic\'s AI Artifacts chat',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <PostHogProvider>
        <body className={inter.className}>
          {children}
        </body>
      </PostHogProvider>
    </html>
  )
}
