import { describe, expect, it } from "vitest";
import { CONTRACT_TAIL } from "@/lib/procurement/types";
import { buildAgentGrantPayload } from "./grants";

describe("T3 grant payload", () => {
  it("scopes an agent to ProcureGuard functions and hosts", () => {
    const payload = buildAgentGrantPayload({
      tenantDid: "did:t3n:abc123",
      agentDid: "did:t3n:agent456",
      scriptVersion: "0.1.0",
      allowedHosts: ["example.com"],
    });

    expect(payload.agents[0].agentDid).toBe("did:t3n:agent456");
    expect(payload.agents[0].scripts[0].scriptName).toBe(`z:abc123:${CONTRACT_TAIL}`);
    expect(payload.agents[0].scripts[0].functions).toEqual(["search-vendors", "submit-purchase-request"]);
    expect(payload.agents[0].scripts[0].allowedHosts).toEqual(["example.com"]);
  });
});
