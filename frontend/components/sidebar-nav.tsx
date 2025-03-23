"use client"

import type React from "react"

import { BarChart3, FileText, Home, PieChart, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  const defaultItems = [
    {
      href: "/",
      title: "Dashboard",
      icon: Home,
    },
    {
      href: "/polls",
      title: "My Polls",
      icon: FileText,
    },
    {
      href: "/channels",
      title: "Channels",
      icon: Users,
    },
    {
      href: "/analytics",
      title: "Analytics",
      icon: BarChart3,
    },
    {
      href: "/reports",
      title: "Reports",
      icon: PieChart,
    },
    {
      href: "/settings",
      title: "Settings",
      icon: Settings,
    },
  ]

  const navItems = items || defaultItems

  return (
    <nav className={cn("hidden md:block flex-col space-x-0 space-y-1 p-4 md:p-6", className)} {...props}>
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start",
            pathname === item.href ? "bg-secondary hover:bg-secondary" : "hover:bg-transparent hover:underline",
          )}
          asChild
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  )
}

