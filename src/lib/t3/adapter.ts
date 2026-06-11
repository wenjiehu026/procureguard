import { CONTRACT_TAIL, type PurchaseSubmission, type VendorQuote } from "@/lib/procurement/types";
import { findQuotes } from "@/lib/procurement/data";
import { getTerminal3Status, type T3Status } from "./status";

export type T3SearchInput = {
  category: string;
  quantity: number;
  maxBudget: number;
  region: string;
};

export type T3SubmitInput = {
  quoteId: string;
  amount: number;
  currency: "USD";
  justification: string;
  approvalId: string;
};

export interface Terminal3Adapter {
  status(): Promise<T3Status>;
  searchVendors(input: T3SearchInput): Promise<VendorQuote[]>;
  submitPurchaseRequest(input: T3SubmitInput): Promise<PurchaseSubmission>;
}

export class MockTerminal3Adapter implements Terminal3Adapter {
  async status() {
    return getTerminal3Status();
  }

  async searchVendors(input: T3SearchInput) {
    return findQuotes({
      category: input.category as Parameters<typeof findQuotes>[0]["category"],
      quantity: input.quantity,
      maxBudget: input.maxBudget,
    });
  }

  async submitPurchaseRequest(input: T3SubmitInput): Promise<PurchaseSubmission> {
    return {
      requestId: `pr-${crypto.randomUUID().slice(0, 8)}`,
      quoteId: input.quoteId,
      amount: input.amount,
      currency: input.currency,
      approvalId: input.approvalId,
      piiHandling: "terminal3-placeholders",
    };
  }
}

export class RealTerminal3Adapter implements Terminal3Adapter {
  async status() {
    return getTerminal3Status();
  }

  async searchVendors(input: T3SearchInput) {
    const result = await executeContract("search-vendors", input);
    return result.quotes as VendorQuote[];
  }

  async submitPurchaseRequest(input: T3SubmitInput) {
    return (await executeContract("submit-purchase-request", input)) as PurchaseSubmission;
  }
}

export function getTerminal3Adapter(): Terminal3Adapter {
  if (process.env.T3N_API_KEY && process.env.USER_KEY && process.env.AGENT_KEY) {
    return new RealTerminal3Adapter();
  }

  return new MockTerminal3Adapter();
}

async function executeContract(functionName: string, input: unknown): Promise<Record<string, unknown>> {
  type AgentClient = {
    handshake(): Promise<void>;
    authenticate(input: unknown): Promise<unknown>;
    executeAndDecode(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
  type T3Sdk = {
    T3nClient: new (input: { wasmComponent: unknown; handlers: { EthSign: unknown } }) => AgentClient;
    setEnvironment(environment: "testnet" | "production"): void;
    loadWasmComponent(): Promise<unknown>;
    eth_get_address(key: string): string;
    metamask_sign(address: string, provider: unknown, key: string): unknown;
    createEthAuthInput(address: string): unknown;
    getScriptVersion(baseUrl: string, scriptName: string): Promise<string>;
    getNodeUrl(): string;
  };

  const sdk = (await import("@terminal3/t3n-sdk")) as unknown as T3Sdk;
  const {
    T3nClient,
    setEnvironment,
    loadWasmComponent,
    eth_get_address,
    metamask_sign,
    createEthAuthInput,
    getScriptVersion,
    getNodeUrl,
  } = sdk;

  setEnvironment(process.env.T3_ENV === "production" ? "production" : "testnet");

  const wasmComponent = await loadWasmComponent();
  const agentKey = process.env.AGENT_KEY;
  const tenantDid = process.env.T3_TENANT_DID;

  if (!agentKey || !tenantDid) {
    throw new Error("Real T3 mode requires AGENT_KEY and T3_TENANT_DID.");
  }

  const agentAddress = eth_get_address(agentKey);
  const agentClient = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(agentAddress, undefined, agentKey),
    },
  });

  await agentClient.handshake();
  await agentClient.authenticate(createEthAuthInput(agentAddress));

  const scriptName = `z:${tenantDid.replace("did:t3n:", "")}:${CONTRACT_TAIL}`;
  const scriptVersion = await getScriptVersion(getNodeUrl(), scriptName);
  return agentClient.executeAndDecode({
    script_name: scriptName,
    script_version: scriptVersion,
    function_name: functionName,
    input,
  });
}
