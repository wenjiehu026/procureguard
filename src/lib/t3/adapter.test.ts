import { describe, expect, it } from "vitest";
import { CONTRACT_TAIL } from "@/lib/procurement/types";
import { getTerminal3Status } from "./status";

describe("Terminal 3 status", () => {
  it("defaults to mock mode with the ProcureGuard contract tail", async () => {
    const status = await getTerminal3Status();
    expect(status.mode).toBe("mock");
    expect(status.contractTail).toBe(CONTRACT_TAIL);
    expect(status.contractScript).toContain(CONTRACT_TAIL);
    expect(status.grantStatus).toBe("mocked");
  });
});
