# Terminal 3 Onboarding Findings

This file is intentionally structured for bounty submission notes.

## Confirmed Integration Notes

- The ADK currently supports TypeScript/JavaScript for client-side tenant and agent operations.
- Contract code is Rust compiled to `wasm32-wasip2`.
- Contract capabilities are determined by `world.wit` imports, not by a separate manifest.
- Outbound HTTP is authorized by the user grant at invocation time, not by contract registration.
- Private profile fields should use `http-with-placeholders` so the plaintext does not enter agent or WASM memory.

## Documentation Gaps To Validate During Real Testnet Work

- The docs mention vendored WIT packages such as `host-interfaces-2.1.0` and `host-tenant-1.0.0`; a direct download command or canonical package source would make first builds smoother.
- The sample uses a flight booking domain. A generic non-flight minimal contract example would help teams building enterprise workflows.
- `agent-auth-update` examples are clear, but a JSON schema for the grant payload would reduce implementation guesswork.
- A table of common SDK environment variables would help separate tenant deployment keys from user and agent keys.

## Bugs / Issues Log

- No real testnet issues recorded yet. Add exact commands, errors, timestamps, and whether the issue reproduces after a clean checkout.
