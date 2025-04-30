import { Button } from "@/components/ui/button"
import { Copy, HelpCircle } from "lucide-react"

export function CopyTradingHeader() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Copy Trading</h1>
          <p className="text-sm text-muted-foreground">Automatically copy the trades of top-performing traders</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="border-border">
            <HelpCircle size={16} className="mr-2" /> How It Works
          </Button>
          <Button>
            <Copy size={16} className="mr-2" /> Start Copy Trading
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-4">
          <div className="bg-primary/10 rounded-full p-2">
            <Copy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">What is Copy Trading?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Copy trading allows you to automatically replicate the trading activity of experienced traders. When they
              make a trade, the same trade is executed in your account proportionally to your settings.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-muted-foreground">Automated Trading</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-muted-foreground">Risk Management</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-muted-foreground">Performance Tracking</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-muted-foreground">Customizable Allocation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
