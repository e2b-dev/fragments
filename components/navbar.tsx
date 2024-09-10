import "core-js/features/object/group-by.js";
import Link from "next/link";
import Image from "next/image";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, LogOut, Plus } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DiscordLogoIcon,
  GitHubLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";

export default function NavBar({
  session,
  showLogin,
  signOut,
  onNewChat,
  onSocialClick,
}: {
  session: Session | null;
  showLogin: () => void;
  signOut: () => void;
  onNewChat: () => void;
  onSocialClick: (target: "github" | "x" | "discord") => void;
}) {
  return (
    <nav className="w-full bg-background">
      <div className="flex">
        <div className="flex flex-1 items-center">
          <Link href="/" className="flex items-center gap-2" target="_blank">
            <Image src="/logo.svg" alt="logo" width={30} height={30} />
            <h1 className="whitespace-pre">AI Artifacts by </h1>
          </Link>
          <Link
            href="https://e2b.dev"
            className="underline decoration-[#ff8800] decoration-2 text-[#ff8800]"
            target="_blank"
          >
            E2B
          </Link>
        </div>
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onNewChat}>
            <Plus className="mr-2 h-4 w-4" /> New chat
          </Button>
          <Separator orientation="vertical" />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="w-9 h-9">
                  <AvatarImage
                    src={
                      session.user.user_metadata?.avatar_url ||
                      "https://avatar.vercel.sh/" + session.user.email
                    }
                    alt="@shadcn"
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
                <DropdownMenuItem onClick={() => onSocialClick("github")}>
                  <GitHubLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  Star us on GitHub
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSocialClick("discord")}>
                  <DiscordLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  Join us on Discord
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSocialClick("x")}>
                  <TwitterLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  Follow us on X
                </DropdownMenuItem>
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
      </div>
    </nav>
  );
}
