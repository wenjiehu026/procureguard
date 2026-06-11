import { describe, expect, it } from "vitest";
import { CONTRACT_TAIL } from "@/lib/procurement/types";
import { MockTerminal3Adapter } from "./adapter";
import { getTerminal3Status } from "./status";

describe("Terminal 3 status", () => {
  it("defaults to mock mode with the ProcureGuard contract tail", async () => {
    const status = await getTerminal3Status();
    expect(status.mode).toBe("mock");
    expect(status.contractTail).toBe(CONTRACT_TAIL);
    expect(status.contractScript).toContain(CONTRACT_TAIL);
    expect(status.grantStatus).toBe("mocked");
  });

  it("searches vendors through the mock T3 adapter for local demos", async () => {
    const adapter = new MockTerminal3Adapter();
    const quotes = await adapter.searchVendors({
      category: "security-key",
      quantity: 2,
      maxBudget: 110,
      region: "US",
    });

    expect(quotes[0].id).toBe("q-northstar-key");
  });
});
