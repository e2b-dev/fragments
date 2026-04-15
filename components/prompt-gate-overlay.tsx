'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface PromptGateOverlayProps {
  onSignIn: () => void
  onDismiss: () => void
}

export function PromptGateOverlay({ onSignIn, onDismiss }: PromptGateOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg font-semibold">Sign in to continue building</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create an account or sign in to start generating your website.
          </p>
          <Button className="mt-6 w-full" onClick={onSignIn}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}
