import { createT3Client } from "./_client.mjs";

const { did, address } = await createT3Client("T3N_API_KEY");

console.log(JSON.stringify({ did, address, environment: process.env.T3_ENV ?? "testnet" }, null, 2));
