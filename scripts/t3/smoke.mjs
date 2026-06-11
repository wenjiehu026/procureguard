import { createT3Client, procurementHost, scriptName } from "./_client.mjs";

const { sdk, t3n: agentClient, did: agentDid } = await createT3Client("AGENT_KEY");
const tenantDid = process.env.T3_TENANT_DID;

if (!tenantDid) {
  throw new Error("T3_TENANT_DID is required.");
}

const targetScript = scriptName(tenantDid);
const scriptVersion = await sdk.getScriptVersion(sdk.getNodeUrl(), targetScript);

const search = await agentClient.executeAndDecode({
  script_name: targetScript,
  script_version: scriptVersion,
  function_name: "search-vendors",
  input: { category: "laptop", quantity: 2, maxBudget: 4000, region: "US" },
});

console.log(
  JSON.stringify(
    {
      agentDid,
      targetScript,
      allowedHost: procurementHost(),
      search,
    },
    null,
    2,
  ),
);
