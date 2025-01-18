import Home from '@/components/home'
import { RepoBanner } from '@/components/repo-banner'

export default function HomePage() {
  return <Home banner={<RepoBanner />} />
}
