"use client"

import { useState } from "react"
import { Check, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export interface SignalsFilterProps {
  onFilterChange: (filters: SignalsFilters) => void
  activeFilters: SignalsFilters
  availableCryptos: string[]
}

export interface SignalsFilters {
  cryptos: string[]
  confidence: number | null
  timeframe: string | null
  agents: string[]
}

export function SignalsFilter({ onFilterChange, activeFilters, availableCryptos }: SignalsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const agents = ["TrendMaster", "WhaleWatcher", "MacroSage"]
  const timeframes = ["24h", "1w", "1m", "All"]
  const confidenceLevels = [
    { label: "All", value: null },
    { label: "High (80%+)", value: 80 },
    { label: "Medium (65%+)", value: 65 },
  ]

  // Count active filters
  const activeFilterCount =
    (activeFilters.cryptos.length > 0 ? 1 : 0) +
    (activeFilters.confidence !== null ? 1 : 0) +
    (activeFilters.timeframe !== null ? 1 : 0) +
    (activeFilters.agents.length > 0 ? 1 : 0)

  const toggleCrypto = (crypto: string) => {
    const newCryptos = activeFilters.cryptos.includes(crypto)
      ? activeFilters.cryptos.filter((c) => c !== crypto)
      : [...activeFilters.cryptos, crypto]

    onFilterChange({
      ...activeFilters,
      cryptos: newCryptos,
    })
  }

  const toggleAgent = (agent: string) => {
    const newAgents = activeFilters.agents.includes(agent)
      ? activeFilters.agents.filter((a) => a !== agent)
      : [...activeFilters.agents, agent]

    onFilterChange({
      ...activeFilters,
      agents: newAgents,
    })
  }

  const setConfidence = (confidence: number | null) => {
    onFilterChange({
      ...activeFilters,
      confidence,
    })
  }

  const setTimeframe = (timeframe: string | null) => {
    onFilterChange({
      ...activeFilters,
      timeframe,
    })
  }

  const clearFilters = () => {
    onFilterChange({
      cryptos: [],
      confidence: null,
      timeframe: null,
      agents: [],
    })
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-gray-200 relative">
          <Filter size={16} className="mr-2" />
          Filter
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-black text-white h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Filter Signals</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-2">Cryptocurrencies</DropdownMenuLabel>
          {availableCryptos.map((crypto, idx) => (
            <DropdownMenuItem
              key={crypto + '-' + idx}
              onSelect={(e) => {
                e.preventDefault()
                toggleCrypto(crypto)
              }}
            >
              {activeFilters.cryptos.includes(crypto) && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilters.cryptos.includes(crypto) ? "font-medium" : ""}>{crypto}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-2">Signal Agents</DropdownMenuLabel>
          {agents.map((agent, idx) => (
            <DropdownMenuItem
              key={agent + '-' + idx}
              onSelect={(e) => {
                e.preventDefault()
                toggleAgent(agent)
              }}
            >
              {activeFilters.agents.includes(agent) && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilters.agents.includes(agent) ? "font-medium" : ""}>{agent}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-2">Confidence Level</DropdownMenuLabel>
          {confidenceLevels.map((level, idx) => (
            <DropdownMenuItem
              key={level.label + '-' + idx}
              onSelect={(e) => {
                e.preventDefault()
                setConfidence(level.value)
              }}
            >
              {activeFilters.confidence === level.value && <Check className="mr-2 h-4 w-4" />}
              <span className={activeFilters.confidence === level.value ? "font-medium" : ""}>{level.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-2">Timeframe</DropdownMenuLabel>
          {timeframes.map((time, idx) => (
            <DropdownMenuItem
              key={time + '-' + idx}
              onSelect={(e) => {
                e.preventDefault()
                setTimeframe(time === "All" ? null : time)
              }}
            >
              {(activeFilters.timeframe === time || (time === "All" && activeFilters.timeframe === null)) && (
                <Check className="mr-2 h-4 w-4" />
              )}
              <span
                className={
                  activeFilters.timeframe === time || (time === "All" && activeFilters.timeframe === null)
                    ? "font-medium"
                    : ""
                }
              >
                {time}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <Button variant="outline" size="sm" className="w-full mt-2" onClick={clearFilters}>
          Clear Filters
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
