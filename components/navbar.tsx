import Logo from './logo'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { LLMModelConfig } from '@/lib/models'
import {
  DiscordLogoIcon,
  GitHubLogoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons'
import { Session } from '@supabase/supabase-js'
import {
  ArrowRight,
  LogOut,
  MoonIcon,
  Plus,
  Settings2,
  SunIcon,
  Undo,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

export function NavBar({
  session,
  showLogin,
  signOut,
  onNewChat,
  onSocialClick,
  languageModel,
  onLanguageModelChange,
  apiKeyConfigurable,
  baseURLConfigurable,
  onUndo,
  canUndo,
}: {
  session: Session | null
  showLogin: () => void
  signOut: () => void
  onNewChat: () => void
  onSocialClick: (target: 'github' | 'x' | 'discord') => void
  languageModel: LLMModelConfig
  onLanguageModelChange: (config: LLMModelConfig) => void
  apiKeyConfigurable: boolean
  baseURLConfigurable: boolean
  onUndo: () => void
  canUndo: boolean
}) {
  const { setTheme, theme } = useTheme()
  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center gap-2" target="_blank">
          <Logo width={24} height={24} />
          <h1 className="whitespace-pre">Artifacts by </h1>
        </Link>
        <Link
          href="https://e2b.dev"
          className="underline decoration-[rgba(229,123,0,.3)] decoration-2 text-[#ff8800]"
          target="_blank"
        >
          E2B
        </Link>
      </div>
      <div className="flex items-center gap-1 md:gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onNewChat}>
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>LLM settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            {apiKeyConfigurable && (
              <>
                <div className="flex flex-col gap-2 px-2 py-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    name="apiKey"
                    type="password"
                    placeholder="Auto"
                    required={true}
                    defaultValue={languageModel.apiKey}
                    onChange={(e) =>
                      onLanguageModelChange({
                        apiKey:
                          e.target.value.length > 0
                            ? e.target.value
                            : undefined,
                      })
                    }
                    className="text-sm"
                  />
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            {baseURLConfigurable && (
              <>
                <div className="flex flex-col gap-2 px-2 py-2">
                  <Label htmlFor="baseURL">Base URL</Label>
                  <Input
                    name="baseURL"
                    type="text"
                    placeholder="Auto"
                    required={true}
                    defaultValue={languageModel.baseURL}
                    onChange={(e) =>
                      onLanguageModelChange({
                        baseURL:
                          e.target.value.length > 0
                            ? e.target.value
                            : undefined,
                      })
                    }
                    className="text-sm"
                  />
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <div className="flex flex-col gap-1.5 px-2 py-2">
              <span className="text-sm font-medium">Parameters</span>
              <div className="flex space-x-4 items-center">
                <span className="text-sm flex-1 text-muted-foreground">
                  Output tokens
                </span>
                <Input
                  type="number"
                  defaultValue={languageModel.maxTokens}
                  min={50}
                  max={10000}
                  step={1}
                  className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
                  placeholder="Auto"
                  onChange={(e) =>
                    onLanguageModelChange({
                      maxTokens: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="flex space-x-4 items-center">
                <span className="text-sm flex-1 text-muted-foreground">
                  Temperature
                </span>
                <Input
                  type="number"
                  defaultValue={languageModel.temperature}
                  min={0}
                  max={5}
                  step={0.01}
                  className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
                  placeholder="Auto"
                  onChange={(e) =>
                    onLanguageModelChange({
                      temperature: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="flex space-x-4 items-center">
                <span className="text-sm flex-1 text-muted-foreground">
                  Top P
                </span>
                <Input
                  type="number"
                  defaultValue={languageModel.topP}
                  min={0}
                  max={1}
                  step={0.01}
                  className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
                  placeholder="Auto"
                  onChange={(e) =>
                    onLanguageModelChange({
                      topP: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="flex space-x-4 items-center">
                <span className="text-sm flex-1 text-muted-foreground">
                  Top K
                </span>
                <Input
                  type="number"
                  defaultValue={languageModel.topK}
                  min={0}
                  max={500}
                  step={1}
                  className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
                  placeholder="Auto"
                  onChange={(e) =>
                    onLanguageModelChange({
                      topK: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="flex space-x-4 items-center">
                <span className="text-sm flex-1 text-muted-foreground">
                  Frequence penalty
                </span>
                <Input
                  type="number"
                  defaultValue={languageModel.frequencyPenalty}
                  min={0}
                  max={2}
                  step={0.01}
                  className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
                  placeholder="Auto"
                  onChange={(e) =>
                    onLanguageModelChange({
                      frequencyPenalty: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="flex space-x-4 items-center">
                <span className="text-sm flex-1 text-muted-foreground">
                  Presence penalty
                </span>
                <Input
                  type="number"
                  defaultValue={languageModel.presencePenalty}
                  min={0}
                  max={2}
                  step={0.01}
                  className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
                  placeholder="Auto"
                  onChange={(e) =>
                    onLanguageModelChange({
                      presencePenalty: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={
                    session.user.user_metadata?.avatar_url ||
                    'https://avatar.vercel.sh/' + session.user.email
                  }
                  alt={session.user.email}
                />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm">My Account</span>
                <span className="text-xs text-muted-foreground">
                  {session.user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSocialClick('github')}>
                <GitHubLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Star us on GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSocialClick('discord')}>
                <DiscordLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Join us on Discord
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSocialClick('x')}>
                <TwitterLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Follow us on X
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {theme === 'light' && (
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <SunIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  Light theme
                </DropdownMenuItem>
              )}
              {theme === 'dark' && (
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <MoonIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  Dark theme
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" onClick={showLogin}>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  )
}
