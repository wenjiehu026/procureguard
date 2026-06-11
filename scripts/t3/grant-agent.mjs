import { createT3Client, procurementHost, scriptName } from "./_client.mjs";

const { sdk, t3n: userClient, did: userDid } = await createT3Client("USER_KEY");
const agent = await createT3Client("AGENT_KEY");
const tenantDid = process.env.T3_TENANT_DID;

if (!tenantDid) {
  throw new Error("T3_TENANT_DID is required after contract registration.");
}

const targetScript = scriptName(tenantDid);
const scriptVersion = await sdk.getScriptVersion(sdk.getNodeUrl(), targetScript);
const userContractVersion = await sdk.getScriptVersion(sdk.getNodeUrl(), "tee:user/contracts");

const grantPayload = {
  agents: [
    {
      agentDid: agent.did,
      scripts: [
        {
          scriptName: targetScript,
          versionReq: scriptVersion,
          functions: ["search-vendors", "submit-purchase-request"],
          allowedHosts: [procurementHost()],
        },
      ],
    },
  ],
};

await userClient.execute({
  script_name: "tee:user/contracts",
  script_version: userContractVersion,
  function_name: "agent-auth-update",
  input: grantPayload,
});

console.log(JSON.stringify({ userDid, agentDid: agent.did, grantPayload }, null, 2));
