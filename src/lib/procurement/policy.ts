import { allowedVendors } from "./data";
import type { PolicyDecision, ProcurementRequest, VendorQuote } from "./types";

const categoryCaps: Record<ProcurementRequest["category"], number> = {
  laptop: 2500,
  monitor: 900,
  "security-key": 120,
  "mobile-device": 1400,
  accessory: 450,
};

const piiPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
];

export function redactPii(value: string) {
  return piiPatterns.reduce((output, pattern) => output.replace(pattern, "[redacted]"), value);
}

export function buildRedactedPrompt(request: ProcurementRequest) {
  return [
    `Department: ${request.department}`,
    `Region: ${request.region}`,
    `Category: ${request.category}`,
    `Quantity: ${request.quantity}`,
    `Budget: ${request.currency} ${request.maxBudget}`,
    `Urgency: ${request.urgency}`,
    `Business purpose: ${redactPii(request.businessPurpose)}`,
    "Do not include employee name, email, phone, or personal identifiers.",
  ].join("\n");
}

export function evaluatePolicy(request: ProcurementRequest, quotes: VendorQuote[]): PolicyDecision {
  const blockers: string[] = [];
  const reasons: string[] = [];
  const categoryCap = categoryCaps[request.category];
  const totalLimit = categoryCap * request.quantity;

  if (request.maxBudget > totalLimit) {
    blockers.push(`Budget exceeds category cap of ${request.currency} ${totalLimit}.`);
  }

  const eligibleQuotes = quotes.filter(
    (quote) =>
      quote.allowed &&
      allowedVendors.has(quote.vendor) &&
      quote.quantityAvailable >= request.quantity &&
      quote.unitPrice * request.quantity <= request.maxBudget,
  );

  if (eligibleQuotes.length === 0) {
    blockers.push("No allowlisted vendor quote fits the requested quantity and budget.");
  } else {
    reasons.push(`${eligibleQuotes.length} allowlisted quote(s) fit budget and quantity.`);
  }

  if (request.urgency === "expedite") {
    reasons.push("Expedited delivery requires manager visibility.");
  }

  const approvalRequired = request.maxBudget >= 2500 || request.quantity > 3 || request.urgency === "expedite";

  if (approvalRequired) {
    reasons.push("Human approval required before the agent can submit a purchase request.");
  }

  const riskLevel = blockers.length > 0 ? "high" : approvalRequired ? "medium" : "low";

  return {
    allowed: blockers.length === 0,
    approvalRequired,
    riskLevel,
    reasons,
    blockers,
    redactedPrompt: buildRedactedPrompt(request),
  };
}

export function chooseBestQuote(quotes: Array<VendorQuote & { totalPrice?: number; withinBudget?: boolean }>) {
  return (
    quotes.find((quote) => quote.allowed && quote.withinBudget) ??
    quotes.find((quote) => quote.allowed) ??
    quotes[0] ??
    null
  );
}
