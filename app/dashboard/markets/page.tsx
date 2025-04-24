"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

export default function MarketsPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Lock className="h-12 w-12 text-gray-400" />
            <p className="text-center text-gray-600">
              We're working on something exciting! The markets page will be available soon.
            </p>
            <Button variant="outline" className="mt-4" disabled>
              Stay Tuned
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
