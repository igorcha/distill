import client from "./client";

export function createCheckoutSession(plan: "monthly" | "yearly") {
  return client.post("/billing/create-checkout-session/", { plan });
}

export function getBillingPortalUrl() {
  return client.get("/billing/portal/");
}
