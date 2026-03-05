import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UpgradeCards from "@/components/UpgradeCards";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border-[#2a2f42] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            You've run out of credits
          </DialogTitle>
          <DialogDescription className="text-[#8b92a5]">
            Upgrade to Pro for 200 credits/month
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <UpgradeCards />
        </div>
      </DialogContent>
    </Dialog>
  );
}
