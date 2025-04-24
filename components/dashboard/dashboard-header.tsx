import { Button } from "@/components/ui/button"
import { Search, Menu } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, John</p>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search markets, assets..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-64"
          />
        </div>

        <Button className="bg-black text-white hover:bg-gray-800">Deposit</Button>

        <Button variant="outline" size="icon" className="md:hidden border-gray-200">
          <Menu size={18} />
        </Button>
      </div>
    </div>
  )
}
