export type GatewayProvider = "EASYPAISA" | "JAZZCASH" | "SIMULATED";

// Only SIMULATED is actually wired server-side in the real backend (an
// honest stub, per the schema's own comment — no real gateway account
// behind Easypaisa/Jazzcash yet). Kept configurable here anyway since the
// UI shape is the same regardless of which provider ends up live.
export interface PaymentGateway {
  id: string;
  provider: GatewayProvider;
  name: string;
  isActive: boolean;
  webhookSecret: string;
}

export const mockPaymentGateways: PaymentGateway[] = [
  { id: "pg_1", provider: "SIMULATED", name: "Simulated Gateway (test mode)", isActive: true, webhookSecret: "whsec_sim_7f3a9c" },
  { id: "pg_2", provider: "EASYPAISA", name: "Easypaisa", isActive: false, webhookSecret: "whsec_ep_pending" },
  { id: "pg_3", provider: "JAZZCASH", name: "JazzCash", isActive: false, webhookSecret: "whsec_jc_pending" },
];
