"use client"

import { ReactNode } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
      <ProtectedRoute>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 hidden md:flex">
                <a className="mr-6 flex items-center space-x-2" href="/dashboard">
                  <span className="font-bold text-xl">Pollemic</span>
                </a>
              </div>
              <div className="flex flex-1 items-center justify-end space-x-4">
                <nav className="flex items-center space-x-2">
                  <ModeToggle />
                  <UserNav />
                </nav>
              </div>
            </div>
          </header>
          <div className="grid flex-1 md:grid-cols-[240px_1fr]">
            <aside className="hidden border-r bg-muted/40 md:block">
              <DashboardNav />
            </aside>
            <main className="flex flex-col p-6">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
  )
}