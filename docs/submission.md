# ProcureGuard Submission Mapping

## Best Agent Auth SDK Implementation

ProcureGuard uses Terminal 3 as the trust boundary for a realistic enterprise workflow. The agent can recommend and prepare a purchase request, but the actual action is scoped by a user grant to a tenant contract, specific functions, and specific outbound hosts.

## Completeness

- Web dashboard for request creation, quote comparison, policy status, approval, and audit.
- Agent API that streams state transitions and pauses for human approval.
- Mock mode for judges without keys.
- Real Terminal 3 scripts for bootstrap, registration, grant, and smoke invocation.
- Rust/WASM contract package with exported procurement functions.

## SDK Integration

- `@terminal3/t3n-sdk` is isolated behind a `Terminal3Adapter`.
- Contract tail is stable: `procureguard-contracts`.
- Secrets are written to `z:<tid>:secrets` as `procurement_api_key`.
- Submission uses placeholder fields for employee name, email, and department.

## Creativity

Procurement is common in governments, banks, and large enterprises, and it naturally combines identity, delegation, policy, auditability, privacy, and real-world transaction workflows.

## Demo Script

1. Show mock mode status.
2. Run a laptop procurement request.
3. Point out that employee email is never included in the agent prompt.
4. Approve the paused action.
5. Show the final audit event and `terminal3-placeholders` handling.
6. Switch to real T3 status after configuring keys and running the scripts.
