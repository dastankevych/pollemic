"use client"

import type React from "react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-2 font-semibold pl-10">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <span className="text-xl">Pollemic</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <UserNav />
            </div>
          </div>
        </header>
        <div className="flex flex-1 mx-auto w-full max-w-screen-2xl">
          <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-[240px] shrink-0 border-r md:sticky md:block">
            <DashboardNav />
          </aside>
          <main className="flex flex-1 flex-col overflow-hidden py-6 px-4 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
