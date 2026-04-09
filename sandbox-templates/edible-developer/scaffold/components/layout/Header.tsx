import Link from 'next/link'
import { siteConfig } from '@/engine'

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold">
          {siteConfig.branding.name}
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
        </nav>
      </div>
    </header>
  )
}
