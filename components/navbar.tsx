'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ExternalLink,
  Loader2,
  LogOut,
  Trash,
  Undo,
} from 'lucide-react'
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
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getSignInUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
  const clientId = process.env.NEXT_PUBLIC_ONSEASON_SSO_CLIENT_ID ?? 'flamingo'
  return `${baseUrl}/api/sso/authorize?client_id=${clientId}&returnTo=/`
}

function getWorkspaceSwitchUrl(workspaceId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
  const clientId = process.env.NEXT_PUBLIC_ONSEASON_SSO_CLIENT_ID ?? 'flamingo'
  return `${baseUrl}/api/sso/authorize?client_id=${clientId}&workspace_id=${workspaceId}&returnTo=/`
}

export function NavBar({
  session,
  onClear,
  canClear,
  onUndo,
  canUndo,
}: {
  session: SessionInfo | null
  onClear: () => void
  canClear: boolean
  onUndo: () => void
  canUndo: boolean
}) {
  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/staycy-only-dark.svg"
            alt="Staycy"
            width={100}
            height={14}
            className="dark:hidden"
            priority
          />
          <Image
            src="/staycy-only-light.svg"
            alt="Staycy"
            width={100}
            height={14}
            className="hidden dark:block"
            priority
          />
        </Link>
      </div>

      {session?.impersonatedBy && (
        <div className="flex items-center gap-1.5 mr-4 px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium">
          <AlertTriangle className="h-3 w-3" />
          <span>Impersonating as {session.name}</span>
        </div>
      )}

      {session ? (
        <AuthenticatedControls
          session={session}
          onClear={onClear}
          canClear={canClear}
          onUndo={onUndo}
          canUndo={canUndo}
        />
      ) : (
        <UnauthenticatedControls />
      )}
    </nav>
  )
}

function UnauthenticatedControls() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" asChild>
        <a href={getSignInUrl()}>Sign In</a>
      </Button>
    </div>
  )
}

function AuthenticatedControls({
  session,
  onClear,
  canClear,
  onUndo,
  canUndo,
}: {
  session: SessionInfo
  onClear: () => void
  canClear: boolean
  onUndo: () => void
  canUndo: boolean
}) {
  return (
    <div className="flex items-center gap-1 md:gap-4">
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
              <Undo className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onClear} disabled={!canClear}>
              <Trash className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear chat</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <ThemeToggle />
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ProfileDropdown session={session} />
    </div>
  )
}

function ProfileDropdown({ session }: { session: SessionInfo }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false)
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false)

  const fetchWorkspaces = useCallback(() => {
    if (workspacesLoaded || isLoadingWorkspaces) return

    setIsLoadingWorkspaces(true)
    fetch('/api/auth/workspaces')
      .then((res) => res.json())
      .then((data: { workspaces?: Workspace[] }) => {
        setWorkspaces(data.workspaces ?? [])
        setWorkspacesLoaded(true)
      })
      .catch(() => {
        setWorkspaces([])
        setWorkspacesLoaded(true)
      })
      .finally(() => {
        setIsLoadingWorkspaces(false)
      })
  }, [workspacesLoaded, isLoadingWorkspaces])

  const handleSignOut = useCallback(() => {
    window.location.href = '/api/auth/logout'
  }, [])

  const handleOpenDashboard = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_ONSEASON_BASE_URL ?? ''
    window.open(baseUrl, '_blank')
  }, [])

  const handleSwitchWorkspace = useCallback((workspaceId: string) => {
    window.location.href = getWorkspaceSwitchUrl(workspaceId)
  }, [])

  const initials = getInitials(session.name)
  const otherWorkspaces = workspaces.filter((w) => w.id !== session.workspaceId)

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) fetchWorkspaces()
      }}
    >
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-8 h-8 cursor-pointer">
                {session.image ? <AvatarImage src={session.image} alt={session.name} /> : null}
                <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>My Account</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{session.name}</span>
          <span className="text-xs text-muted-foreground font-normal">{session.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Workspace switcher */}
        {isLoadingWorkspaces && (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
            Loading workspaces...
          </DropdownMenuItem>
        )}
        {workspacesLoaded && otherWorkspaces.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Switch workspace
            </DropdownMenuLabel>
            {otherWorkspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSwitchWorkspace(workspace.id)}
              >
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{workspace.name}</span>
                <ChevronRight className="ml-auto h-3 w-3 text-muted-foreground" />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

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
