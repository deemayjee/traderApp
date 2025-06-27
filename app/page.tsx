import { HeroSection } from "@/components/hero-section"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "HyperAgent - Autonomous Trading on Hyperliquid",
  description: "Train AI agents to trade perpetual futures autonomously with advanced machine learning and risk management.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <Footer />
    </div>
  )
}
