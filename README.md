# ProcureGuard

ProcureGuard is a bounty-ready enterprise procurement agent for the Terminal 3 Agent Dev Kit challenge. It lets an employee request equipment, lets an AI agent compare vendors and check procurement policy, and submits a simulated purchase request only after the agent has the right Terminal 3 authorization.

Core pitch: an enterprise agent can act for a user without exposing sensitive employee data to the LLM, app server, or agent runtime.

## Demo Flow

1. Open the dashboard and submit the default laptop request.
2. Watch the streamed agent trail: Terminal 3 status, quote search, policy guardrails, recommendation, and approval request.
3. Approve the request.
4. The agent invokes the submit path and records that PII handling used Terminal 3 placeholders.

The app runs in mock T3 mode without keys. With real testnet keys, the same adapter path can execute the deployed TEE contract.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` when you have Terminal 3 testnet keys:

```bash
T3_ENV=testnet
T3N_API_KEY=...
USER_KEY=...
AGENT_KEY=...
PROCUREMENT_API_KEY=...
PROCUREMENT_API_BASE=https://your-public-demo-url.example
```

## Terminal 3 Testnet Path

```bash
npm run t3:bootstrap
cd contracts/procureguard-tee
cargo build --target wasm32-wasip2 --release --features wasm
cd ../..
npm run t3:register
npm run t3:grant
npm run t3:smoke
```

What this demonstrates:

- Tenant onboarding and DID discovery through the SDK.
- Contract registration under `procureguard-contracts`.
- `secrets` KV map creation with contract-only ACL.
- `procurement_api_key` sealed into the tenant namespace.
- User-signed `agent-auth-update` scoped to `search-vendors`, `submit-purchase-request`, and the procurement host.

## API Surface

- `POST /api/agent/procure`: streams procurement agent events as NDJSON.
- `POST /api/procurement/search`: demo quote search endpoint.
- `POST /api/procurement/requests`: simulated purchase request endpoint.
- `POST /api/t3/status`: mock/real Terminal 3 status.

## Judging Notes

- Completeness: working dashboard, streamed agent flow, approval gate, mock/real T3 adapter, TEE contract package, scripts, docs, tests.
- SDK integration: follows Terminal 3 ADK concepts: tenant DID, contract tail, scoped grant, allowed hosts, secrets map, `http`, and `http-with-placeholders`.
- Creativity: procurement is a realistic enterprise/government workflow with privacy and auditability built into the agent action path.

## Screenshot Checklist

- Dashboard initial state showing T3 mode and contract tail.
- Agent stream after quote search and policy evaluation.
- Approval pause before submission.
- Submitted purchase request with placeholder PII handling.
- T3 status panel in real mode once keys are configured.
