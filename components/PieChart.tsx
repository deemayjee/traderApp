'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  assets: Array<{
    metadata: {
      symbol: string
    }
    allocation: number
  }>
}

export function PieChart({ assets }: PieChartProps) {
  const data = {
    labels: assets.map(asset => asset.metadata.symbol),
    datasets: [
      {
        data: assets.map(asset => asset.allocation),
        backgroundColor: [
          '#3B82F6', // blue
          '#10B981', // green
          '#F59E0B', // yellow
          '#EF4444', // red
          '#8B5CF6', // purple
          '#EC4899', // pink
          '#6366F1', // indigo
          '#14B8A6', // teal
        ],
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(156 163 175)',
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.raw || 0
            return `${label}: ${value.toFixed(1)}%`
          }
        }
      }
    }
  }

  return (
    <div className="w-full h-[200px] flex items-center justify-center">
      <Pie data={data} options={options} />
    </div>
  )
} 