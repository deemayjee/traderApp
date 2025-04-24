import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, TrendingUp, Users, Zap, BarChart3, MessageSquare } from "lucide-react"

export function FeatureSection() {
  const features = [
    {
      icon: <Brain className="h-10 w-10 text-gray-900" />,
      title: "AI-Powered Insights",
      description: "Advanced AI agents analyze market trends and provide actionable trading insights.",
    },
    {
      icon: <Users className="h-10 w-10 text-gray-900" />,
      title: "Social Trading",
      description: "Follow top traders, share strategies, and learn from the community.",
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-gray-900" />,
      title: "Real-Time Analytics",
      description: "Access real-time market data, price movements, and trading volumes.",
    },
    {
      icon: <Zap className="h-10 w-10 text-gray-900" />,
      title: "Smart Alerts",
      description: "Receive personalized notifications for market opportunities and risks.",
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-gray-900" />,
      title: "Performance Tracking",
      description: "Monitor your portfolio performance and compare with top traders.",
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-gray-900" />,
      title: "AI Chat Assistant",
      description: "Get instant answers to your crypto questions from our AI assistant.",
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white border-gray-200 hover:border-gray-300 transition-all">
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
