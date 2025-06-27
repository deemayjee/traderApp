"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bot, TrendingUp, Zap, Brain } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function HeroSection() {
  const [agentCount, setAgentCount] = useState(0)
  const [tradingVolume, setTradingVolume] = useState(0)

  useEffect(() => {
    // Animate counters
    const agentTimer = setInterval(() => {
      setAgentCount(prev => prev < 1247 ? prev + 17 : 1247)
    }, 50)

    const volumeTimer = setInterval(() => {
      setTradingVolume(prev => prev < 2.4 ? prev + 0.05 : 2.4)
    }, 100)

    return () => {
      clearInterval(agentTimer)
      clearInterval(volumeTimer)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/10">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(104,255,249,0.08),transparent_70%)]" />
      
      {/* Simplified floating elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-primary/60 rounded-full animate-pulse-glow" />
      <div className="absolute bottom-32 right-20 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse-glow" />

      {/* Top Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            HyperAgent
          </span>
        </Link>

        {/* Launch App Button */}
        <Link href="/dashboard">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 glow-primary"
          >
            Launch App
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Badge */}
            <Badge 
              variant="outline" 
              className="px-4 py-2 border-primary/30 text-primary bg-primary/10"
            >
              <Zap className="w-4 h-4 mr-2" />
              Powered by Advanced AI
            </Badge>

            {/* Main heading */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Autonomous Trading
                <br />
                <span className="hyperliquid-primary">on Hyperliquid</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Train AI agents to trade perpetual futures autonomously with advanced machine learning and risk management.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg glow-primary"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Start Trading
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/ai-agents">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 py-4 text-lg border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Simplified Stats */}
            <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto pt-12">
              <div className="text-center group">
                <div className="text-4xl font-bold text-primary mb-2">
                  {agentCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Active AI Agents</div>
              </div>
              
              <div className="text-center group">
                <div className="text-4xl font-bold text-primary mb-2">
                  ${tradingVolume.toFixed(1)}M
                </div>
                <div className="text-sm text-muted-foreground">24h Volume</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
