'use client'

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, ChevronRight, ExternalLink, LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState } from 'react'

export interface SessionInfo {
  pmId: string
  workspaceId: string
  email: string
  name: string
  image: string | null
  subscriptionStatus: 'active' | 'inactive'
  mode: 'active' | 'preview'
  subdomain: string | null
  customDomain: string | null
  tenantId: string | null
  currency: string
  impersonatedBy: string | null
}

interface Workspace {
  id: string
  name: string
  logoUrl?: string | null
}

/** Get avatar URL — custom image or DiceBear fallback (matches Onseason's avatar logic) */
function getAvatarUrl(user: { email: string; image: string | null }): string {
  if (user.image) return user.image
  const seed = user.email.toLowerCase().trim()
  const params = new URLSearchParams({
    seed,
    radius: '12',
    backgroundType: 'gradientLinear',
    backgroundRotation: '315',
    backgroundColor: 'd946ef,fdba74',
  })
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`
}

function getSignInUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
  const clientId = process.env.NEXT_PUBLIC_ONSEASON_SSO_CLIENT_ID ?? 'flamingo'
  return `${baseUrl}/api/sso/authorize?client_id=${clientId}&returnTo=/`
}

export function NavBar({ session }: { session: SessionInfo | null }) {
  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/staycy-only-dark.svg"
            alt="Staycy"
            width={100}
            height={14}
            style={{ width: 100, height: 'auto' }}
            className="dark:hidden"
            priority
          />
          <Image
            src="/staycy-only-light.svg"
            alt="Staycy"
            width={100}
            height={14}
            style={{ width: 100, height: 'auto' }}
            className="hidden dark:block"
            priority
          />
        </Link>
      </div>

      {session?.impersonatedBy && (
        <div className="flex items-center gap-1.5 mr-4 px-3 py-1 rounded-md bg-[var(--warning-bg)] text-[var(--warning)] text-body-sm font-medium">
          <AlertTriangle className="h-3 w-3" />
          <span>Impersonating as {session.name}</span>
        </div>
      )}

      {session ? <AuthenticatedControls session={session} /> : <UnauthenticatedControls />}
    </nav>
  )
}

function UnauthenticatedControls() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" className="rounded-full" asChild>
        <a href={getSignInUrl()}>Sign In</a>
      </Button>
    </div>
  )
}

function AuthenticatedControls({ session }: { session: SessionInfo }) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm" disabled>
              Publish
            </Button>
          </TooltipTrigger>
          <TooltipContent>Publishing coming soon</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ProfileDropdown session={session} />
    </div>
  )
}

function ProfileDropdown({ session }: { session: SessionInfo }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [hasMultipleWorkspaces, setHasMultipleWorkspaces] = useState(false)
  const [workspacesFetched, setWorkspacesFetched] = useState(false)

  const fetchWorkspaceInfo = useCallback(() => {
    if (workspacesFetched) return
    setWorkspacesFetched(true)
    fetch('/api/auth/workspaces')
      .then((res) => res.json())
      .then((data: { workspaces?: Workspace[] }) => {
        const list = data.workspaces ?? []
        const current = list.find((w) => w.id === session.workspaceId)
        if (current) setCurrentWorkspace(current)
        setHasMultipleWorkspaces(list.length > 1)
      })
      .catch(() => {})
  }, [workspacesFetched, session.workspaceId])

  const handleSignOut = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' }).then(() => {
      window.location.href = '/'
    })
  }, [])

  const handleOpenDashboard = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
    window.open(baseUrl, '_blank')
  }, [])

  const handleSwitchWorkspace = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
    const clientId = process.env.NEXT_PUBLIC_ONSEASON_SSO_CLIENT_ID ?? 'flamingo'
    window.location.href = `${baseUrl}/workspace-picker?client_id=${clientId}&returnTo=/`
  }, [])

  const avatarUrl = getAvatarUrl(session)

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) fetchWorkspaceInfo()
      }}
    >
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Avatar className="size-8 rounded-lg cursor-pointer">
                <AvatarImage src={avatarUrl} alt={session.name} className="rounded-lg" />
              </Avatar>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>My Account</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{session.name}</span>
          <span className="text-body-sm text-muted-foreground font-normal">{session.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Current workspace */}
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          {currentWorkspace?.logoUrl ? (
            <img
              src={currentWorkspace.logoUrl}
              alt={currentWorkspace.name}
              className="size-6 rounded-sm object-cover"
            />
          ) : (
            <div className="flex size-6 items-center justify-center rounded-sm bg-primary/10 text-body-sm font-semibold text-primary">
              {(currentWorkspace?.name ?? 'W').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="flex-1 truncate text-sm">{currentWorkspace?.name ?? 'Workspace'}</span>
        </DropdownMenuLabel>
        {hasMultipleWorkspaces && (
          <DropdownMenuItem onClick={handleSwitchWorkspace}>
            <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
            Switch workspace
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleOpenDashboard}>
          <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
          Onseason Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
