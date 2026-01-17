# VerifyMe Chain (Sui Move)

Move package for the VerifyMe on-chain registry + issuer/credential flows.

## Folder layout

- `sources/verifyme_chain.move` – main module (`verifyme_chain::verifyme_chain`)
- `Move.toml` – package manifest (at the root of the Move package)
- `Published.toml` – generated after publish (tracks the latest published package id per environment)

> If you don’t see `Move.toml` / `Published.toml`, you’re not in the Move package root.

## Prerequisites

- Sui CLI installed (`sui`)
- A configured client environment (devnet/testnet/localnet)
- Some SUI coins to pay gas (devnet/testnet: faucet; mainnet: real SUI)

Useful checks:

```powershell
sui --version
sui client envs
sui client active-env
sui client active-address
```

## Build

From the Move package root:

```powershell
sui move build
```

## Publish

From the Move package root:

```powershell
sui client publish --gas-budget 200000000
```

### Important: `init` is NOT callable

This package defines a module initializer:

- `fun init(ctx: &mut TxContext)`

Sui runs this automatically during **publish/upgrade**.

If you attempt to call it with `sui client call`, you’ll get:

- `NonEntryFunctionInvoked`

## Find the objects created by `init`

`init` transfers 2 objects to the publisher:

- `AdminCap`
- `VerifyMeRegistry`

List your objects:

```powershell
sui client objects
```

Find lines that contain:

- `::verifyme_chain::AdminCap`
- `::verifyme_chain::VerifyMeRegistry`

Save their `objectId` values — you’ll need them for calls.

## Contract quick reference

### Constants (from Move code)

- issuer_type: `1 = COOP`, `2 = NON_COOP`
- verification_method: `2 = EXTERNAL`, `3 = LEGAL`, `4 = DNS`

### Entry functions you can call from CLI

These functions are declared as `public entry fun ...` and can be called via `sui client call`:

- `register_issuer(reg, issuer_type, now_ms)`
- `request_dns_verification(reg, issuer_id, domain_hash, evidence_hash, now_ms)`
- `approve_dns(admin_cap, reg, issuer_id, approve, now_ms)`
- `request_legal_verification(reg, issuer_id, legal_doc_hash, evidence_hash, now_ms)`
- `approve_legal(admin_cap, reg, issuer_id, approve, now_ms)`
- `issue_credential_by_coop_issuer(reg, issuer_id, credential_type, owner_address, cccd_hash, data_hash, now_ms)`
- `submit_credential_by_user_noncoop(reg, issuer_id, credential_type, owner_address, data_hash, now_ms)`
- `verify_credential_result(admin_cap, reg, credential_id, verification_method, success, evidence_hash, now_ms)`
- `claim_credential_by_cccd(reg, credential_id, user_cccd_hash, now_ms)`
- `revoke_credential_by_issuer(reg, credential_id, now_ms)`

> `ctx: &mut TxContext` is injected by Sui automatically; you do not pass it.

## CLI examples (copy/paste)

Replace the placeholders:

- `PACKAGE_ID` – the published package id (from `Published.toml`) 
- `REGISTRY_ID` – your `VerifyMeRegistry` object id
- `ADMIN_CAP_ID` – your `AdminCap` object id
- `NOW_MS` – unix time in milliseconds

### 1) Register an issuer

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function register_issuer --args REGISTRY_ID 1 NOW_MS --gas-budget 100000000
```

### 2) Request DNS verification

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function request_dns_verification --args REGISTRY_ID ISSUER_ID DOMAIN_HASH EVIDENCE_HASH NOW_MS --gas-budget 100000000
```

- `DOMAIN_HASH` is `vector<u8>` (example: `[1,2,3,4]`)
- `EVIDENCE_HASH` is `Option<vector<u8>>` (see note below)

### 3) Approve DNS (admin)

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function approve_dns --args ADMIN_CAP_ID REGISTRY_ID ISSUER_ID true NOW_MS --gas-budget 100000000
```

### 4) Request legal verification

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function request_legal_verification --args REGISTRY_ID ISSUER_ID LEGAL_DOC_HASH EVIDENCE_HASH NOW_MS --gas-budget 100000000
```

### 5) Approve legal (admin)

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function approve_legal --args ADMIN_CAP_ID REGISTRY_ID ISSUER_ID true NOW_MS --gas-budget 100000000
```

### 6) Submit credential (NON_COOP)

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function submit_credential_by_user_noncoop --args REGISTRY_ID ISSUER_ID CREDENTIAL_TYPE 0xYOUR_ADDRESS DATA_HASH NOW_MS --gas-budget 100000000
```

### 7) Verify credential (admin/oracle)

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function verify_credential_result --args ADMIN_CAP_ID REGISTRY_ID CREDENTIAL_ID 2 true EVIDENCE_HASH NOW_MS --gas-budget 100000000
```

### 8) Claim credential by CCCD

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function claim_credential_by_cccd --args REGISTRY_ID CREDENTIAL_ID USER_CCCD_HASH NOW_MS --gas-budget 100000000
```

### 9) Revoke credential

```powershell
sui client call --package PACKAGE_ID --module verifyme_chain --function revoke_credential_by_issuer --args REGISTRY_ID CREDENTIAL_ID NOW_MS --gas-budget 100000000
```

## Notes about `Option<...>` arguments

Some entry functions take `Option<address>` or `Option<vector<u8>>`.

- If you are calling from a frontend, use the Sui TypeScript SDK / wallet adapter (it handles BCS encoding).
- If you want CLI-only flows, it’s usually easier to add alternative entry functions that don’t use `Option`.

If you want, I can add two helper entry functions for CLI demos:

- `issue_credential_to_address(...)` (no `Option`)
- `issue_credential_to_cccd(...)` (no `Option`)

## Troubleshooting

### `NonEntryFunctionInvoked`

You tried to call a function that is not `entry` (commonly `init`). Only `public entry fun` can be called with `sui client call`.

### Client/server API version mismatch warning

You may see:

`Client/Server api version mismatch`

It’s usually non-fatal, but you should upgrade your Sui CLI to match the network when possible.
