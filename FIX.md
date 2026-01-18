# Fixes and Workflow Alignment

The project code has been updated to align with the decentralized verification workflow.

## 1. Issuer Workflow
- **Co-op Status**: Registration now supports distinction between Co-op (Level 1) and Non-coop (Level 2).
- **Verification Stages**:
  - **DNS**: Added `requestDnsVerificationTransaction` in `issuerService` and connected to UI in `Verification.jsx`. This submits an on-chain request instead of a local mock update.
  - **Legal**: Added `requestLegalVerificationTransaction` in `issuerService` and connected to UI.
- **Issuance**:
  - `issueCredentialTransaction` fully implemented to write to blockchain.
  - Supports issuing by **Candidate Address** (Platform User) or **CCCD Hash** (Offline User).

## 2. Candidate Workflow
- **Claiming**: Added `claimCredentialTransaction` to `candidateService`. This allows a user to link a credential issued to their CCCD hash to their specific wallet address.
- **Self-Declaration**: Added `submitSelfDeclaredCredentialTransaction` to allow non-coop submissions.

## 3. Admin Workflow
- **Approvals**: Added `approveDnsTransaction` and `approveLegalTransaction` to `adminService`. This enables the admin to approve the verification requests submitted by issuers on-chain.

## 4. Storage (Walrus)
- `storageService.ts` stub created. Currently handles file uploads via browser `URL.createObjectURL` but is structured to accept a Walrus blob upload implementation in the future.

## 5. Next Steps for Developer
1. **Deploy Contract**: Ensure `verifyme_chain` is deployed.
2. **Update Constants**: Copy `Package ID`, `Registry ID`, and `Admin Cap ID` to `src/constants/blockchain.ts`.
3. **Run Admin Dashboard**: Use a wallet holding the `Admin Cap` to approve registered issuers.
4. **Walrus**: Implement actual HTTP PUT to Walrus publisher in `storageService.ts`.
