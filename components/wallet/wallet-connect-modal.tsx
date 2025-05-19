import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"

interface WalletConnectModalProps {
  onClose: () => void
  onError: (error: string) => void
}

export default function WalletConnectModal({ onClose, onError }: WalletConnectModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6">
          <Loading size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">
            Please approve the connection in your wallet
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 