import Link from "next/link"
import { Bot, Zap, Github, Twitter, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-background/95 backdrop-blur">
      <div className="container mx-auto px-6 py-12">

        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <p>&copy; 2024 PallyTraders. All rights reserved.</p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="hover:text-primary transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>

        {/* Hyperliquid Attribution */}
        <div className="mt-6 pt-6 border-t border-border/40">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Built on{" "}
              <Link 
                href="https://hyperliquid.xyz" 
                className="text-primary hover:text-primary/80 transition-colors font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hyperliquid
              </Link>
              {" "}• The most advanced decentralized perpetual exchange
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
