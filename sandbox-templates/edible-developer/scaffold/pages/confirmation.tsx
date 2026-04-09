import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { siteConfig } from '@/engine'
import { PageShell } from '@/components/layout/PageShell'

export default function ConfirmationPage() {
  const router = useRouter()
  const { id } = router.query

  return (
    <PageShell>
      <Head>
        <title>Booking Confirmed | {siteConfig.branding.name}</title>
      </Head>
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          &#10003;
        </div>
        <h1 className="text-3xl font-bold mb-3">Booking confirmed!</h1>
        <p className="text-muted-foreground mb-2">
          Your reservation <span className="font-mono text-foreground">{id}</span> has been confirmed.
        </p>
        <p className="text-muted-foreground mb-8">
          A confirmation email will be sent to you shortly with all the details.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </PageShell>
  )
}
