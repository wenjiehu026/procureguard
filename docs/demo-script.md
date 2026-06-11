# ProcureGuard Demo Script

Use this as the 2-3 minute bounty recording flow.

## 1. Opening

ProcureGuard is an enterprise procurement agent that can act for an employee only inside a Terminal 3 authorization boundary. It demonstrates agent delegation, scoped egress, policy guardrails, and PII-safe transaction submission.

## 2. Show The Trust Boundary

Point to the `Trust Path`:

`User -> Agent Auth Grant -> TEE Contract -> Approved Host`

Explain that the user grant scopes:

- Agent DID
- Contract script `z:<tid>:procureguard-contracts`
- Functions `search-vendors` and `submit-purchase-request`
- Allowed procurement host

Open `Grant Payload Viewer` and show the same shape that Terminal 3 documents for `agent-auth-update`.

## 3. Scenario 1: Approval Required

1. Select `Approval Required`.
2. Click `Run procurement agent`.
3. Show that quotes come through `Terminal3Adapter.searchVendors`.
4. Show policy passes but approval is required.
5. Click `Approve`.
6. Show `Submission Receipt`, `Receipt hash`, and `terminal3-placeholders`.

Talk track: the agent can prepare the transaction, but cannot submit until the approval gate is satisfied.

## 4. Scenario 2: Policy Blocked

1. Select `Policy Blocked`.
2. Click `Run procurement agent`.
3. Show the policy blocker.
4. Show that no receipt is created.

Talk track: the agent is useful, but deterministic guardrails still stop out-of-policy delegated actions.

## 5. Scenario 3: Low Risk Auto Submit

1. Select `Low Risk Auto Submit`.
2. Click `Run procurement agent`.
3. Show automatic submission with `auto-low-risk`.

Talk track: low-risk purchases can complete autonomously because they stay under policy thresholds.

## 6. Export Evidence

Click `Export` in `Result Evidence`.

The JSON includes:

- Scenario
- Terminal 3 status
- Grant payload preview
- Submission receipt
- Receipt fingerprint
- Streamed audit events

## 7. Real Testnet Path

Explain that mock mode is included for judge-friendly local review. With testnet keys configured, the same `Terminal3Adapter` switches to real mode and invokes the TEE contract functions through `@terminal3/t3n-sdk`.
