"use client"

import Link from "next/link"
import { LogOut, Settings, LayoutDashboard, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
  const { user, logout } = useAuth()

  if (!user) return null

  const initials =
    user.full_name
      ?.split(" ")
      .map((n: string) => n.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2) || "U"

  // Hospitals don't have a settings page yet — only patient/doctor
  const settingsPath =
    user.user_type === "patient" || user.user_type === "doctor"
      ? `/${user.user_type}/settings`
      : null
  const dashboardPath = `/${user.user_type}/dashboard`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="size-9">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium truncate">{user.full_name}</span>
          <span className="text-xs text-muted-foreground truncate font-normal">
            {user.email}
          </span>
          <span className="text-xs text-muted-foreground capitalize font-normal mt-0.5">
            {user.user_type}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardPath} className="cursor-pointer">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        {settingsPath && (
          <DropdownMenuItem asChild>
            <Link href={settingsPath} className="cursor-pointer">
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
