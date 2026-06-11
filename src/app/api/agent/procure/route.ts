import { encodeNdjson, makeEvent } from "@/lib/procurement/audit";
import { draftRecommendation } from "@/lib/procurement/agent";
import { findQuotes } from "@/lib/procurement/data";
import { evaluatePolicy } from "@/lib/procurement/policy";
import { approvalSchema, procurementRequestSchema } from "@/lib/procurement/schemas";
import type { AgentEvent } from "@/lib/procurement/types";
import { getTerminal3Adapter } from "@/lib/t3/adapter";

const encoder = new TextEncoder();

type RequestBody = {
  request: unknown;
  approval?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const procurementRequest = procurementRequestSchema.parse(body.request);
  const approval = body.approval ? approvalSchema.parse(body.approval) : null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => controller.enqueue(encoder.encode(encodeNdjson(event)));

      try {
        const t3 = getTerminal3Adapter();
        const status = await t3.status();
        send(
          makeEvent(
            "auth",
            status.mode === "real" ? "Terminal 3 session ready" : "Terminal 3 mock session ready",
            `${status.agentDid} scoped to ${status.contractScript}. Grant status: ${status.grantStatus}.`,
            status,
          ),
        );

        const quotes = findQuotes(procurementRequest);
        send(
          makeEvent(
            "quotes",
            "Vendor quotes returned",
            `${quotes.length} quote(s) evaluated. Non-PII search can be executed through the TEE contract search-vendors function.`,
            { quotes },
          ),
        );

        const policy = evaluatePolicy(procurementRequest, quotes);
        send(
          makeEvent(
            policy.allowed ? "policy" : "blocked",
            policy.allowed ? "Policy guardrails passed" : "Policy guardrails blocked the request",
            [...policy.reasons, ...policy.blockers].join(" ") || "No policy notes.",
            { policy },
          ),
        );

        const recommendation = await draftRecommendation({
          request: procurementRequest,
          quotes,
          policy,
        });

        send(
          makeEvent(
            recommendation.nextAction === "blocked" ? "blocked" : "recommendation",
            "Agent recommendation prepared",
            `${recommendation.summary} ${recommendation.rationale}`,
            { recommendation },
          ),
        );

        if (!policy.allowed || recommendation.nextAction === "blocked" || !recommendation.selectedQuoteId) {
          controller.close();
          return;
        }

        const selectedQuote = quotes.find((quote) => quote.id === recommendation.selectedQuoteId) ?? quotes[0];
        const amount = selectedQuote.unitPrice * procurementRequest.quantity;

        if (policy.approvalRequired && !approval) {
          send(
            makeEvent(
              "approval-requested",
              "Human approval required",
              `Approve ${amount} ${selectedQuote.currency} for ${selectedQuote.itemName} before the agent submits the request.`,
              { quoteId: selectedQuote.id, amount, currency: selectedQuote.currency },
            ),
          );
          controller.close();
          return;
        }

        if (approval && !approval.approved) {
          send(
            makeEvent(
              "approval-denied",
              "Approval denied",
              "The agent stopped before any submit-purchase-request action was invoked.",
            ),
          );
          controller.close();
          return;
        }

        send(
          makeEvent(
            "approval-approved",
            "Approval recorded",
            `Approval ${approval?.approvalId ?? "auto-low-risk"} unlocks submit-purchase-request.`,
          ),
        );

        const submitted = await t3.submitPurchaseRequest({
          quoteId: selectedQuote.id,
          amount,
          currency: selectedQuote.currency,
          justification: recommendation.rationale,
          approvalId: approval?.approvalId ?? "auto-low-risk",
        });

        send(
          makeEvent(
            "submitted",
            "Purchase request submitted",
            `${submitted.requestId} submitted with PII handling: ${submitted.piiHandling}.`,
            { submitted },
          ),
        );

        controller.close();
      } catch (error) {
        send(
          makeEvent(
            "error",
            "Agent run failed",
            error instanceof Error ? error.message : "Unknown procurement agent error.",
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
