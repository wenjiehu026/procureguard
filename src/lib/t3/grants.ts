import { CONTRACT_TAIL } from "@/lib/procurement/types";

export type AgentGrantInput = {
  tenantDid: string;
  agentDid: string;
  scriptVersion: string;
  allowedHosts: string[];
};

export function buildAgentGrantPayload(input: AgentGrantInput) {
  const tenantId = input.tenantDid.replace("did:t3n:", "");

  return {
    agents: [
      {
        agentDid: input.agentDid,
        scripts: [
          {
            scriptName: `z:${tenantId}:${CONTRACT_TAIL}`,
            versionReq: input.scriptVersion,
            functions: ["search-vendors", "submit-purchase-request"],
            allowedHosts: input.allowedHosts,
          },
        ],
      },
    ],
  };
}
