"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SignalCommentsProps {
  signalId: string
}

export default function SignalComments({ signalId }: SignalCommentsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">Recent Similar Signals</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="text-sm">
              <div className="font-medium">BTC Buy Signal</div>
              <div className="text-gray-500">3 days ago</div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-600 hover:bg-green-100">
              +8.2%
            </Badge>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="text-sm">
              <div className="font-medium">BTC Buy Signal</div>
              <div className="text-gray-500">2 weeks ago</div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-600 hover:bg-green-100">
              +12.5%
            </Badge>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="text-sm">
              <div className="font-medium">BTC Buy Signal</div>
              <div className="text-gray-500">1 month ago</div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-600 hover:bg-green-100">
              +5.8%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 