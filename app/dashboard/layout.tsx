import type React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <Footer />
      </div>
  )
}
