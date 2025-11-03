"use client"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { JSX } from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { LogOut, Github, Package } from "lucide-react"

type HeaderProps = Readonly<{ userTokens: number }>

export default function Header({ userTokens }: HeaderProps): JSX.Element {
  const formattedTokens = Number.isFinite(userTokens)
    ? userTokens.toLocaleString()
    : "0"
  const { data: session, status } = useSession()
  const isLoggedIn: boolean = status === "authenticated"
  const displayName: string = session?.user?.name ?? "Guest"
  const initial: string = displayName.slice(0, 1).toUpperCase()
  const handleLogin = (): void => {
    window.location.assign(`/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
  }
  
  return (
    <header className="border-b border-border bg-card" role="banner" aria-label="TokenHub header">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            AI
          </div>
          <h1 className="text-2xl font-bold text-foreground">TokenHub</h1>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
              <span className="text-sm text-muted-foreground">Available Tokens:</span>
              <span className="text-lg font-semibold text-primary">{formattedTokens}</span>
            </div>
          )}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  {session?.user?.image ? (
                    <AvatarImage src={session.user.image} alt={displayName} />
                  ) : (
                    <AvatarFallback>{initial}</AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => window.open("https://github.com/", "_blank", "noopener,noreferrer")}
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => window.open("https://www.npmjs.com/", "_blank", "noopener,noreferrer")}
                >
                  <Package className="h-4 w-4" />
                  <span>npm</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => { void signOut({ callbackUrl: "/" }) }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 cursor-pointer"
              aria-label="Sign in"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
