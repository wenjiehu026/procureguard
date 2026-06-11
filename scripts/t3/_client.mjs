import { readFile } from "node:fs/promises";

export const CONTRACT_TAIL = "procureguard-contracts";

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function procurementHost() {
  const base = process.env.PROCUREMENT_API_BASE ?? "http://localhost:3000";
  return new URL(base).host;
}

export async function loadSdk() {
  const sdk = await import("@terminal3/t3n-sdk");
  sdk.setEnvironment(process.env.T3_ENV === "production" ? "production" : "testnet");
  return sdk;
}

export async function createT3Client(keyName) {
  const sdk = await loadSdk();
  const key = requiredEnv(keyName);
  const wasmComponent = await sdk.loadWasmComponent();
  const address = sdk.eth_get_address(key);
  const t3n = new sdk.T3nClient({
    wasmComponent,
    handlers: {
      EthSign: sdk.metamask_sign(address, undefined, key),
    },
  });

  await t3n.handshake();
  const did = await t3n.authenticate(sdk.createEthAuthInput(address));

  return { sdk, t3n, did: did.value, address };
}

export async function createTenantClient() {
  const { sdk, t3n, did } = await createT3Client("T3N_API_KEY");
  const tenantDid = process.env.T3_TENANT_DID ?? did;
  const tenant = new sdk.TenantClient({
    t3n,
    baseUrl: sdk.getNodeUrl(),
    tenantDid,
  });

  return { sdk, t3n, tenant, tenantDid };
}

export async function readWasm(path = "contracts/procureguard-tee/target/wasm32-wasip2/release/procureguard_tee.wasm") {
  return readFile(path);
}

export function scriptName(tenantDid) {
  return `z:${tenantDid.replace("did:t3n:", "")}:${CONTRACT_TAIL}`;
}
