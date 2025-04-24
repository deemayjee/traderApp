import { HeroSection } from "@/components/hero-section"
import { FeatureSection } from "@/components/feature-section"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <HeroSection />
      <FeatureSection />
      <Footer />
    </main>
  )
}
