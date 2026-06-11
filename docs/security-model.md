# Security Model

ProcureGuard demonstrates a delegated enterprise agent workflow where the agent can help plan and submit a procurement request without receiving unnecessary personal data.

## Trust Boundaries

- The web app can collect employee request data for the demo flow.
- The agent prompt is built from redacted request details.
- Deterministic policy checks run outside the LLM and block out-of-policy actions.
- Terminal 3 authorization scopes the agent to a contract script, specific functions, and allowed outbound hosts.
- The procurement API key is intended to be stored in `z:<tid>:secrets`.
- Employee PII for submission is represented as placeholders for the Terminal 3 host/enclave path.

## Guardrails

- Category budget caps.
- Allowlisted vendors only.
- Quantity and budget approval thresholds.
- Human approval before medium-risk submission.
- No submission receipt is created for blocked requests.

## Evidence

The UI shows:

- `Trust Path`: user delegation to agent grant, TEE contract, and approved host.
- `Grant Payload Viewer`: grant scope preview.
- `Submission Receipt`: request id, quote id, amount, approval id, PII handling, and receipt hash.
- `Real Mode Readiness`: configuration gaps before testnet execution.
- Exportable audit JSON for each run.

## Residual Risks

- The current local mode is a mock for judge-friendly review.
- Real testnet execution requires Terminal 3 keys and contract registration.
- Rust/WASM host binding calls should be validated against the target Terminal 3 testnet WIT packages before final submission.
