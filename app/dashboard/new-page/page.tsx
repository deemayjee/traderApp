"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Loader2, ShieldCheck, RefreshCw, Download, Terminal, Cpu, MemoryStick, Wifi, CheckCircle, AlertTriangle } from "lucide-react"

function SystemOverviewCard({ title, value, sub, icon, accent }: any) {
  return (
    <Card className={`bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border-none shadow-lg ${accent} text-white`}> 
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardDescription className="uppercase tracking-widest text-xs text-zinc-400">{title}</CardDescription>
          <CardTitle className="text-3xl font-bold text-white">{value}</CardTitle>
          <div className="text-xs text-zinc-400 mt-1">{sub}</div>
        </div>
        <div className="rounded-full bg-zinc-900/60 p-2">{icon}</div>
      </CardHeader>
    </Card>
  )
}

function QuickAction({ icon, label }: any) {
  return (
    <Button variant="ghost" className="flex flex-col items-center justify-center bg-zinc-800/70 hover:bg-zinc-700/80 text-cyan-300 font-semibold shadow-md h-20 w-20 rounded-xl">
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Button>
  )
}

export default function DashboardNewPage() {
  const [tab, setTab] = useState("performance")
  // Mock data
  const systemStats = {
    cpu: { usage: 56, speed: "3.8 GHz", cores: 12 },
    memory: { usage: 65, used: 16.4, total: 24 },
    network: { usage: 87, speed: "1.2 GB/s", latency: 42 },
    uptime: "14d 06:42:18",
    timezone: "UTC-08:00",
    systemTime: "18:42:14",
    systemDate: "May 14, 2025"
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-zinc-900/90 border-r border-zinc-800 flex flex-col py-8 px-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center font-bold text-zinc-900">N</div>
            <span className="text-xl font-bold tracking-tight text-cyan-300">NEXUS OS</span>
          </div>
          <nav className="flex-1 space-y-2">
            {[
              { label: "Dashboard", icon: <Cpu className="w-5 h-5" />, active: true },
              { label: "Diagnostics", icon: <ShieldCheck className="w-5 h-5" /> },
              { label: "Data Center", icon: <MemoryStick className="w-5 h-5" /> },
              { label: "Network", icon: <Wifi className="w-5 h-5" /> },
              { label: "Security", icon: <ShieldCheck className="w-5 h-5" /> },
              { label: "Console", icon: <Terminal className="w-5 h-5" /> },
              { label: "Communications", icon: <Wifi className="w-5 h-5" /> },
              { label: "Settings", icon: <Cpu className="w-5 h-5" /> },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${item.active ? "bg-cyan-900/30 text-cyan-300" : "hover:bg-zinc-800/80 text-zinc-300"}`}> 
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="mt-10">
            <div className="text-xs text-zinc-400 mb-2">SYSTEM STATUS</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span>Core Systems</span>
                <span className="text-cyan-300 font-bold">80%</span>
              </div>
              <Progress value={80} className="h-2 bg-zinc-800" />
              <div className="flex items-center justify-between text-xs">
                <span>Security</span>
                <span className="text-green-400 font-bold">75%</span>
              </div>
              <Progress value={75} className="h-2 bg-zinc-800" />
              <div className="flex items-center justify-between text-xs">
                <span>Network</span>
                <span className="text-purple-400 font-bold">87%</span>
              </div>
              <Progress value={87} className="h-2 bg-zinc-800" />
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300">System Overview</h2>
              <span className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded ml-2">LIVE</span>
            </div>
            <div className="bg-zinc-900/80 rounded-xl p-6 flex flex-col items-center min-w-[260px]">
              <div className="text-4xl font-mono font-bold text-cyan-300">{systemStats.systemTime}</div>
              <div className="text-zinc-400 text-sm mb-4">{systemStats.systemDate}</div>
              <div className="flex gap-6 text-xs text-zinc-400">
                <div>
                  <div className="font-bold text-white">Uptime</div>
                  <div>{systemStats.uptime}</div>
                </div>
                <div>
                  <div className="font-bold text-white">Time Zone</div>
                  <div>{systemStats.timezone}</div>
                </div>
              </div>
            </div>
          </div>
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SystemOverviewCard
              title="CPU Usage"
              value="56%"
              sub="3.8 GHz | 12 Cores"
              icon={<Cpu className="w-7 h-7 text-cyan-300" />}
              accent="shadow-cyan-900/40"
            />
            <SystemOverviewCard
              title="Memory"
              value="65%"
              sub="16.4 GB / 24 GB"
              icon={<MemoryStick className="w-7 h-7 text-purple-300" />}
              accent="shadow-purple-900/40"
            />
            <SystemOverviewCard
              title="Network"
              value="87%"
              sub="1.2 GB/s | 42ms"
              icon={<Wifi className="w-7 h-7 text-fuchsia-300" />}
              accent="shadow-fuchsia-900/40"
            />
          </div>
          {/* Performance Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="col-span-2 bg-zinc-900/80 border-none shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className="bg-zinc-800/80">
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="processes">Processes</TabsTrigger>
                      <TabsTrigger value="storage">Storage</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {/* Placeholder for chart */}
                <div className="h-48 flex items-center justify-center text-zinc-400">
                  <Loader2 className="animate-spin mr-2" /> Chart coming soon...
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/80 border-none shadow-lg flex flex-col items-center justify-center p-6">
              <div className="text-lg font-bold text-cyan-300 mb-4">Quick Actions</div>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction icon={<ShieldCheck className="w-6 h-6" />} label="Security Scan" />
                <QuickAction icon={<RefreshCw className="w-6 h-6" />} label="Sync Data" />
                <QuickAction icon={<Download className="w-6 h-6" />} label="Backup" />
                <QuickAction icon={<Terminal className="w-6 h-6" />} label="Console" />
              </div>
            </Card>
          </div>
          {/* Security Status, Alerts, Resource Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/80 border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                  <ShieldCheck className="w-5 h-5" /> Security Status
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Firewall</span>
                  <span className="ml-auto text-green-400 font-semibold">Active</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">Antivirus</span>
                  <span className="ml-auto text-green-400 font-semibold">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Encryption</span>
                  <span className="ml-auto text-green-400 font-semibold">Enabled</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/80 border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
                  <AlertTriangle className="w-5 h-5" /> System Alerts
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-400 w-4 h-4" /> Security Scan Complete
                  <span className="ml-auto text-xs text-zinc-400">14:32:12</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-yellow-400 w-4 h-4" /> No threats detected
                  <span className="ml-auto text-xs text-zinc-400">14:32:12</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-400 w-4 h-4" /> System running smoothly
                  <span className="ml-auto text-xs text-zinc-400">14:32:12</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/80 border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-lg">
                  <Cpu className="w-5 h-5" /> Resource Allocation
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Processing Power</span>
                    <span className="text-cyan-300 font-bold">42% allocated</span>
                  </div>
                  <Progress value={42} className="h-2 bg-zinc-800" />
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Memory Allocation</span>
                    <span className="text-purple-300 font-bold">68% allocated</span>
                  </div>
                  <Progress value={68} className="h-2 bg-zinc-800" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Network Bandwidth</span>
                    <span className="text-fuchsia-300 font-bold">35% allocated</span>
                  </div>
                  <Progress value={35} className="h-2 bg-zinc-800" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 