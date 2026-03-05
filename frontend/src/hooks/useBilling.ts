import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession, getBillingPortalUrl } from "@/api/billing";

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (plan: "monthly" | "yearly") => createCheckoutSession(plan),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: () => getBillingPortalUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });
}
