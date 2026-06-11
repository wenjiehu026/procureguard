import { CONTRACT_TAIL } from "@/lib/procurement/types";

export type T3Status = {
  mode: "mock" | "real";
  environment: "testnet" | "production";
  tenantDid: string;
  agentDid: string;
  contractTail: string;
  contractScript: string;
  contractVersion: string;
  grantStatus: "missing" | "mocked" | "configured";
  allowedHosts: string[];
  readiness: T3ReadinessCheck[];
};

export type T3ReadinessCheck = {
  id:
    | "sdk-keys"
    | "tenant-did"
    | "agent-did"
    | "contract-version"
    | "procurement-host"
    | "procurement-secret"
    | "grant-configured";
  label: string;
  status: "pass" | "warning" | "missing";
  detail: string;
};

function hasRealKeys() {
  return Boolean(process.env.T3N_API_KEY && process.env.USER_KEY && process.env.AGENT_KEY);
}

export async function getTerminal3Status(): Promise<T3Status> {
  const mode = hasRealKeys() ? "real" : "mock";
  const tenantDid = process.env.T3_TENANT_DID ?? "did:t3n:mock-tenant-0000000000000000000000000000000001";
  const tenantId = tenantDid.replace("did:t3n:", "");
  const procurementBase = process.env.PROCUREMENT_API_BASE ?? "http://localhost:3000";
  const grantStatus = mode === "mock" ? "mocked" : process.env.T3_GRANT_CONFIGURED === "true" ? "configured" : "missing";
  const allowedHosts = [new URL(procurementBase).host];

  return {
    mode,
    environment: process.env.T3_ENV === "production" ? "production" : "testnet",
    tenantDid,
    agentDid: process.env.T3_AGENT_DID ?? "did:t3n:mock-agent-00000000000000000000000000000000001",
    contractTail: CONTRACT_TAIL,
    contractScript: `z:${tenantId}:${CONTRACT_TAIL}`,
    contractVersion: process.env.T3_CONTRACT_VERSION ?? "0.1.0",
    grantStatus,
    allowedHosts,
    readiness: buildReadiness({
      mode,
      tenantDid,
      grantStatus,
      allowedHosts,
    }),
  };
}

function buildReadiness(input: {
  mode: "mock" | "real";
  tenantDid: string;
  grantStatus: T3Status["grantStatus"];
  allowedHosts: string[];
}): T3ReadinessCheck[] {
  const realMode = input.mode === "real";

  return [
    {
      id: "sdk-keys",
      label: "SDK keys configured",
      status: hasRealKeys() ? "pass" : "missing",
      detail: hasRealKeys()
        ? "T3N_API_KEY, USER_KEY, and AGENT_KEY are present."
        : "Add T3N_API_KEY, USER_KEY, and AGENT_KEY to run real testnet mode.",
    },
    {
      id: "tenant-did",
      label: "Tenant DID resolved",
      status: process.env.T3_TENANT_DID || !realMode ? "pass" : "missing",
      detail: process.env.T3_TENANT_DID
        ? input.tenantDid
        : "Mock tenant is shown locally; real mode should read tenant DID after T3 authentication.",
    },
    {
      id: "agent-did",
      label: "Agent DID resolved",
      status: process.env.T3_AGENT_DID || !realMode ? "pass" : "warning",
      detail: process.env.T3_AGENT_DID
        ? process.env.T3_AGENT_DID
        : "Mock agent DID is shown locally; real grant should use the authenticated agent DID.",
    },
    {
      id: "contract-version",
      label: "Contract version pinned",
      status: process.env.T3_CONTRACT_VERSION || !realMode ? "pass" : "warning",
      detail: `Using ${process.env.T3_CONTRACT_VERSION ?? "0.1.0"} for grant preview and contract invocation.`,
    },
    {
      id: "procurement-host",
      label: "Allowed host configured",
      status: input.allowedHosts.length > 0 ? "pass" : "missing",
      detail: input.allowedHosts.join(", "),
    },
    {
      id: "procurement-secret",
      label: "Procurement API key seeded",
      status: process.env.PROCUREMENT_API_KEY ? "pass" : "warning",
      detail: process.env.PROCUREMENT_API_KEY
        ? "PROCUREMENT_API_KEY is available for the contract secrets map."
        : "Set PROCUREMENT_API_KEY and seed it into z:<tid>:secrets before real smoke tests.",
    },
    {
      id: "grant-configured",
      label: "Agent grant configured",
      status: input.grantStatus === "configured" || input.grantStatus === "mocked" ? "pass" : "missing",
      detail:
        input.grantStatus === "configured"
          ? "T3_GRANT_CONFIGURED=true indicates the user grant has been issued."
          : input.grantStatus === "mocked"
            ? "Mock grant is active for local judging; real grant still needs testnet keys."
            : "Run npm run t3:grant after registering the contract.",
    },
  ];
}
