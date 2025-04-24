"use client"

import { Button } from "@/components/ui/button"
import { Brain, Plus, HelpCircle } from "lucide-react"

interface AIAgentsHeaderProps {
  onCreateNewAgent: () => void
  onGenerateSignal: () => void
}

export function AIAgentsHeader({ onCreateNewAgent, onGenerateSignal }: AIAgentsHeaderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-sm text-gray-500">Configure and manage your AI trading assistants</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="border-gray-200">
            <HelpCircle size={16} className="mr-2" /> How It Works
          </Button>
          <Button className="bg-black text-white hover:bg-gray-800" onClick={onCreateNewAgent}>
            <Plus size={16} className="mr-2" /> Create New Agent
          </Button>
          <Button onClick={onGenerateSignal}>Generate Signal</Button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 rounded-full p-2">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">What are AI Agents?</h3>
            <p className="text-sm text-gray-600 mt-1">
              AI Agents are specialized artificial intelligence models trained to analyze market data, identify
              patterns, and generate trading signals. You can customize their behavior, risk tolerance, and focus areas.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-600">24/7 Market Analysis</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-600">Customizable Strategies</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-600">Performance Tracking</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-600">Automated Signals</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
