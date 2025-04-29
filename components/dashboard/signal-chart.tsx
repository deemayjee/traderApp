"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BarChart2, Target } from "lucide-react"

interface SignalChartProps {
  signalId: string
}

export default function SignalChart({ signalId }: SignalChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Chart Pattern</h3>
          <BarChart2 className="h-5 w-5 text-gray-500" />
        </div>
        <div className="bg-gray-100 h-48 rounded flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Target className="h-8 w-8 mx-auto mb-2" />
            <p>Chart visualization would appear here</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 