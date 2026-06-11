import { CONTRACT_TAIL } from "@/lib/procurement/types";

export type T3Status = {
  mode: "mock" | "real";
  environment: "testnet" | "production";
  tenantDid: string;
  agentDid: string;
  contractTail: string;
  contractScript: string;
  grantStatus: "missing" | "mocked" | "configured";
  allowedHosts: string[];
};

function hasRealKeys() {
  return Boolean(process.env.T3N_API_KEY && process.env.USER_KEY && process.env.AGENT_KEY);
}

export async function getTerminal3Status(): Promise<T3Status> {
  const mode = hasRealKeys() ? "real" : "mock";
  const tenantDid = process.env.T3_TENANT_DID ?? "did:t3n:mock-tenant-0000000000000000000000000000000001";
  const tenantId = tenantDid.replace("did:t3n:", "");
  const procurementBase = process.env.PROCUREMENT_API_BASE ?? "http://localhost:3000";

  return {
    mode,
    environment: process.env.T3_ENV === "production" ? "production" : "testnet",
    tenantDid,
    agentDid: process.env.T3_AGENT_DID ?? "did:t3n:mock-agent-00000000000000000000000000000000001",
    contractTail: CONTRACT_TAIL,
    contractScript: `z:${tenantId}:${CONTRACT_TAIL}`,
    grantStatus: mode === "mock" ? "mocked" : process.env.T3_GRANT_CONFIGURED === "true" ? "configured" : "missing",
    allowedHosts: [new URL(procurementBase).host],
  };
}
