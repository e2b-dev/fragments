'use client'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getSandboxIDForUser } from '@/lib/sandbox'

export function DeployDialog({ userID }: { userID: string }) {
  const [vercelToken, setVercelToken] = useState('')
  const [sandboxID, setSandboxID] = useState<string | null>(null)

  async function deploySandbox() {
    console.log('deploy sandbox', { userID })
    if (!userID) return
    getSandboxIDForUser(userID).then(id => {
      console.log('id', id)
      setSandboxID(id || null)
    })
  }

  useEffect(() => {
    console.log('sandboxID', sandboxID)
  }, [sandboxID])

  return (
    <Dialog>
      <DialogTrigger className="text-xs bg-[#FFE7CC]/50 hover:bg-[#FFE7CC] transition-all p-2 rounded-sm text-[#3d3929]">Deploy on Vercel ▲</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deploy on Vercel ▲</DialogTitle>
          <DialogDescription>
            Deploy your AI Artifact on Vercel.
          </DialogDescription>
        </DialogHeader>

        {/* Stdout and stderr of Vercel's CLI that's running on server */}
        <div className="">
          <Input value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} placeholder="Vercel token" />
        </div>


        <DialogFooter>
          <button
            className="bg-[#FF8800] text-white px-4 py-2 rounded-md hover:bg-[#FF8800]/80 transition-all"
            onClick={() => {
              deploySandbox()
            }}
          >
            Deploy
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}