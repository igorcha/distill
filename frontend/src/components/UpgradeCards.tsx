import { useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateCheckoutSession } from "@/hooks/useBilling";

export default function UpgradeCards() {
  const checkout = useCreateCheckoutSession();
  const redirectingRef = useRef<"monthly" | "yearly" | null>(null);

  const handleCheckout = (plan: "monthly" | "yearly") => {
    redirectingRef.current = plan;
    checkout.mutate(plan);
  };

  const isCheckoutBusy = checkout.isPending || redirectingRef.current !== null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Monthly */}
      <div className="flex flex-col rounded-xl border border-[#2a2f42] bg-[#0f1117] p-5">
        <p className="text-sm font-medium text-[#8b92a5]">Monthly</p>
        <div className="mt-2 h-[60px]">
          <span className="text-3xl font-bold text-white">$6.99</span>
          <span className="text-sm text-[#8b92a5]">/mo</span>
        </div>

        <ul className="space-y-2 text-sm text-[#8b92a5]">
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-[#3B5BDB]" />
            200 credits/month
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-[#3B5BDB]" />
            Priority support
          </li>
        </ul>

        <div className="mt-auto pt-5">
          <Button
            onClick={() => handleCheckout("monthly")}
            disabled={isCheckoutBusy}
            variant="outline"
            className="w-full border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
          >
            {redirectingRef.current === "monthly" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Upgrade"
            )}
          </Button>
        </div>
      </div>

      {/* Yearly */}
      <div className="relative flex flex-col rounded-xl border border-[#3B5BDB] bg-[#0f1117] p-5">
        <Badge className="absolute -top-2.5 right-4 border-none bg-[#3B5BDB] text-white text-[10px]">
          Best Value
        </Badge>
        <p className="text-sm font-medium text-[#8b92a5]">Yearly</p>
        <div className="mt-2 h-[60px]">
          <div>
            <span className="text-3xl font-bold text-white">$4.99</span>
            <span className="text-sm text-[#8b92a5]">/mo</span>
          </div>
          <p className="mt-1 text-xs text-[#555b6e]">
            billed as $59.88/year
          </p>
        </div>

        <ul className="space-y-2 text-sm text-[#8b92a5]">
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-[#3B5BDB]" />
            200 credits/month
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-[#3B5BDB]" />
            Priority support
          </li>
        </ul>

        <div className="mt-auto pt-5">
          <Button
            onClick={() => handleCheckout("yearly")}
            disabled={isCheckoutBusy}
            className="w-full bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer shadow-[0_0_20px_rgba(59,91,219,0.4)]"
          >
            {redirectingRef.current === "yearly" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Upgrade"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
