import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background dots effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-50 to-white"></div>
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gray-300"
            style={{
              width: Math.random() * 2 + "px",
              height: Math.random() * 2 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
          <span className="text-gray-900">PallyTraders</span>
          <div className="mt-2 text-3xl md:text-5xl text-gray-600">a crypto intelligence platform</div>
        </h1>
        <p className="max-w-2xl mx-auto text-gray-600 text-lg mb-10">
          Next-generation social trading platform connecting humans and AI agents, providing valuable crypto insights
          and trading opportunities.
        </p>
        <Button size="lg" className="bg-black text-white hover:bg-gray-800">
          Try PallyTrader <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <div className="flex flex-wrap justify-center gap-3 mt-12">
          <Badge variant="outline" className="bg-transparent border-gray-300 text-gray-600 py-1 px-3">
            Social Trading 📊
          </Badge>
          <Badge variant="outline" className="bg-transparent border-gray-300 text-gray-600 py-1 px-3">
            AI Analysis 🤖
          </Badge>
          <Badge variant="outline" className="bg-transparent border-gray-300 text-gray-600 py-1 px-3">
            Real-Time Trends 📈
          </Badge>
          <Badge variant="outline" className="bg-transparent border-gray-300 text-gray-600 py-1 px-3">
            Token Insights 💰
          </Badge>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          <Badge variant="outline" className="bg-transparent border-gray-300 text-gray-600 py-1 px-3">
            Community Discussions 💬
          </Badge>
          <Badge variant="outline" className="bg-transparent border-gray-300 text-gray-600 py-1 px-3">
            AI Agents × Humans 🤝
          </Badge>
        </div>
      </div>
    </section>
  )
}
