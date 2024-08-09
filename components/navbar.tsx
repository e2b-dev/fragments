import Link from 'next/link'
import Image from 'next/image'
import { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'

export default function NavBar({ session, showLogin, signOut }: { session: Session | null, showLogin: () => void, signOut: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 grid grid-cols-3 px-4 py-2">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2" target="_blank">
          <Image src="/logo.svg" alt="logo" width={30} height={30} />
          <h1 className="whitespace-pre text-[#3d3929]">AI Artifacts by </h1>
        </Link>
        <Link href="https://e2b.dev" className="underline decoration-[#ff8800] decoration-2 text-[#ff8800]" target="_blank">E2B</Link>
      </div>

      <div className="flex justify-center">
        <Link href="https://github.com/e2b-dev/ai-artifacts" className="bg-white shadow-md rounded-lg px-4 py-2 text-[#3d3929] text-sm hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2" target="_blank">
          <span>⭐ Give AI Artifacts a star on GitHub</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-github">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </Link>
      </div>
      <div className="flex justify-end">
        {session ? (
          <div className="flex items-center">
            <span className="text-sm text-[#3d3929] font-medium">{session.user.email}</span>
            <Button variant="link" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="icon" className="text-sm text-[#3d3929] font-medium px-8 py-2" onClick={showLogin}>
            Sign in
          </Button>
        )}
      </div>
    </div>
  )
}
