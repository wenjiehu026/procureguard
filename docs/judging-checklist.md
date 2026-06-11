# Judging Checklist

Use this checklist before submitting ProcureGuard.

## Product Demo

- [ ] Approval Required scenario runs.
- [ ] Policy Blocked scenario blocks before submission.
- [ ] Low Risk Auto Submit scenario submits without approval.
- [ ] Grant Payload Viewer is visible.
- [ ] Result Evidence shows receipt hash after submission.
- [ ] Audit JSON export works.
- [ ] No browser console errors during the three scenarios.

## Terminal 3 Integration

- [ ] `Terminal3Adapter.searchVendors` is used by the agent path.
- [ ] `Terminal3Adapter.submitPurchaseRequest` is used by the agent path.
- [ ] Contract tail is `procureguard-contracts`.
- [ ] Grant payload scopes `search-vendors` and `submit-purchase-request`.
- [ ] Allowed host matches the deployed procurement API host.
- [ ] `http-with-placeholders` is documented and represented in the receipt.

## Real Testnet

- [ ] Test tokens claimed.
- [ ] Rust target installed: `wasm32-wasip2`.
- [ ] `cargo install wasm-tools` complete.
- [ ] Contract builds.
- [ ] Contract registers.
- [ ] `z:<tid>:secrets` map created.
- [ ] `procurement_api_key` seeded.
- [ ] User grant signed.
- [ ] Smoke test passes.

## Submission Assets

- [ ] Demo video recorded using `docs/demo-script.md`.
- [ ] `docs/onboarding-findings.md` updated with real issues or gaps.
- [ ] `docs/architecture.md` reviewed.
- [ ] `docs/security-model.md` reviewed.
- [ ] CI is green.
