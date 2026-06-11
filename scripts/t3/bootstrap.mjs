import { createTenantClient } from "./_client.mjs";

const { tenant, tenantDid } = await createTenantClient();
const me = await tenant.me();

console.log(
  JSON.stringify(
    {
      tenantDid,
      tenant: me,
      next: "Build the Rust contract, then run npm run t3:register.",
    },
    null,
    2,
  ),
);
