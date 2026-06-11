import { createTenantClient, readWasm, scriptName, CONTRACT_TAIL, requiredEnv } from "./_client.mjs";

const { tenant, tenantDid } = await createTenantClient();
const wasm = await readWasm(process.env.WASM_PATH);
const version = process.env.CONTRACT_VERSION ?? "0.1.0";

const result = await tenant.contracts.register({
  tail: CONTRACT_TAIL,
  version,
  wasm,
});

const contractId = result.contract_id;

try {
  await tenant.maps.create({
    tail: "secrets",
    visibility: "private",
    writers: { only: [contractId] },
    readers: { only: [contractId] },
  });
} catch (error) {
  if (!String(error).includes("MapAlreadyExists")) throw error;
}

await tenant.executeControl("map-entry-set", {
  map_name: tenant.canonicalName("secrets"),
  key: "procurement_api_key",
  value: requiredEnv("PROCUREMENT_API_KEY"),
});

console.log(
  JSON.stringify(
    {
      tenantDid,
      contractId,
      scriptName: scriptName(tenantDid),
      version,
      secret: "procurement_api_key sealed in z:<tid>:secrets",
    },
    null,
    2,
  ),
);
