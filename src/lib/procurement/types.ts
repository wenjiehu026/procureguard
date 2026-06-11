export const CONTRACT_TAIL = "procureguard-contracts";

export type ProcurementCategory =
  | "laptop"
  | "monitor"
  | "security-key"
  | "mobile-device"
  | "accessory";

export type ProcurementRequest = {
  employeeName: string;
  employeeEmail: string;
  department: string;
  category: ProcurementCategory;
  quantity: number;
  maxBudget: number;
  currency: "USD";
  region: "US" | "EU" | "APAC";
  urgency: "standard" | "expedite";
  businessPurpose: string;
};

export type VendorQuote = {
  id: string;
  vendor: string;
  vendorDomain: string;
  category: ProcurementCategory;
  itemName: string;
  unitPrice: number;
  currency: "USD";
  quantityAvailable: number;
  deliveryDays: number;
  sustainabilityScore: number;
  warrantyMonths: number;
  dataResidency: "US" | "EU" | "APAC" | "Global";
  allowed: boolean;
};

export type PolicyDecision = {
  allowed: boolean;
  approvalRequired: boolean;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  blockers: string[];
  redactedPrompt: string;
};

export type ProcurementRecommendation = {
  summary: string;
  selectedQuoteId: string | null;
  rationale: string;
  nextAction: "request_approval" | "submit_purchase_request" | "blocked";
};

export type AgentEventType =
  | "auth"
  | "policy"
  | "quotes"
  | "recommendation"
  | "approval-requested"
  | "approval-approved"
  | "approval-denied"
  | "submitted"
  | "blocked"
  | "error";

export type AgentEvent = {
  id: string;
  type: AgentEventType;
  title: string;
  detail: string;
  timestamp: string;
  payload?: unknown;
};

export type PurchaseSubmission = {
  requestId: string;
  quoteId: string;
  amount: number;
  currency: "USD";
  approvalId: string;
  piiHandling: "terminal3-placeholders";
};

export type DemoScenario = {
  id: "approval-required" | "policy-blocked" | "low-risk-auto-submit";
  label: string;
  description: string;
  expectedOutcome: "Approval required before submission" | "Blocked by policy guardrails" | "Auto-submitted without approval";
  request: ProcurementRequest;
};
