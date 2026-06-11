import { generateText, Output } from "ai";
import { z } from "zod";
import { chooseBestQuote } from "./policy";
import type {
  PolicyDecision,
  ProcurementRecommendation,
  ProcurementRequest,
  VendorQuote,
} from "./types";

const recommendationSchema = z.object({
  summary: z.string().min(10),
  selectedQuoteId: z.string().nullable(),
  rationale: z.string().min(10),
  nextAction: z.enum(["request_approval", "submit_purchase_request", "blocked"]),
});

export async function draftRecommendation(input: {
  request: ProcurementRequest;
  quotes: Array<VendorQuote & { totalPrice?: number; withinBudget?: boolean }>;
  policy: PolicyDecision;
}): Promise<ProcurementRecommendation> {
  const fallback = fallbackRecommendation(input);

  if (!process.env.AI_MODEL && !process.env.VERCEL_OIDC_TOKEN && !process.env.AI_GATEWAY_API_KEY) {
    return fallback;
  }

  try {
    const { output } = await generateText({
      model: process.env.AI_MODEL ?? "openai/gpt-5.4",
      output: Output.object({
        name: "ProcurementRecommendation",
        description: "A policy-aware procurement recommendation with no PII.",
        schema: recommendationSchema,
      }),
      prompt: [
        "You are ProcureGuard, an enterprise procurement agent.",
        "Use only redacted request details. Do not mention employee names or email addresses.",
        "Pick an allowlisted, in-budget quote when possible.",
        `Policy allowed: ${input.policy.allowed}`,
        `Approval required: ${input.policy.approvalRequired}`,
        `Risk: ${input.policy.riskLevel}`,
        `Reasons: ${input.policy.reasons.join("; ") || "none"}`,
        `Blockers: ${input.policy.blockers.join("; ") || "none"}`,
        `Request:\n${input.policy.redactedPrompt}`,
        `Quotes:\n${JSON.stringify(input.quotes, null, 2)}`,
      ].join("\n\n"),
    });

    if (input.policy.blockers.length > 0) {
      return { ...output, selectedQuoteId: null, nextAction: "blocked" };
    }

    return output;
  } catch {
    return fallback;
  }
}

export function fallbackRecommendation(input: {
  quotes: Array<VendorQuote & { totalPrice?: number; withinBudget?: boolean }>;
  policy: PolicyDecision;
}): ProcurementRecommendation {
  if (!input.policy.allowed) {
    return {
      summary: "The request is blocked by procurement policy.",
      selectedQuoteId: null,
      rationale: input.policy.blockers.join(" "),
      nextAction: "blocked",
    };
  }

  const selected = chooseBestQuote(input.quotes);
  const nextAction = input.policy.approvalRequired ? "request_approval" : "submit_purchase_request";

  return {
    summary: selected
      ? `${selected.vendor} is the recommended supplier for this request.`
      : "No supplier recommendation is available.",
    selectedQuoteId: selected?.id ?? null,
    rationale: selected
      ? `${selected.itemName} is allowlisted, fits the budget, ships in ${selected.deliveryDays} day(s), and includes ${selected.warrantyMonths} months of warranty.`
      : "The agent could not find an eligible quote.",
    nextAction,
  };
}
