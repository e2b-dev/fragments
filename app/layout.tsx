import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import { MotionProvider, PostHogProvider, ThemeProvider } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Staycy by OnSeason — AI Gen Studio',
  description:
    'Direct Booking Websites for the AI Era. Build stunning hospitality websites with AI.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PostHogProvider>
        <body className={`${inter.variable} ${bricolage.variable} font-sans`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <MotionProvider>{children}</MotionProvider>
          </ThemeProvider>
          <Toaster />
          <Analytics />
        </body>
      </PostHogProvider>
    </html>
  )
}
