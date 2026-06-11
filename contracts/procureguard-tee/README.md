# ProcureGuard TEE Contract

This package contains the Terminal 3 tenant contract for ProcureGuard.

Exports:

- `search-vendors`: non-PII supplier quote search through `host:interfaces/http`.
- `submit-purchase-request`: purchase request submission through `host:interfaces/http-with-placeholders`.

Build:

```bash
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release --features wasm
wasm-tools component wit target/wasm32-wasip2/release/procureguard_tee.wasm
```

The `wit/world.wit` imports the Terminal 3 host interfaces shown in the official ADK walkthrough. If the target testnet provides vendored WIT packages, copy them into `wit/deps/` before the WASM build.
