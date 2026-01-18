// @ts-nocheck
import { candidates as candidateMocks } from "../mocks/candidates";
import { credentials as credentialMocks } from "../mocks/credentials";
import { accessRequests } from "../mocks/requests";
import { normalizeAddress } from "../utils/address";
import { depositService } from "./depositService";
import { verificationService } from "./verificationService";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, REGISTRY_ID } from "../constants/blockchain";

const delay = (data, ms = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

let candidateState = candidateMocks.map((candidate) => ({ ...candidate }));
let credentialState = credentialMocks.map((credential) => ({ ...credential }));

const legacyDepositStatus = (deposit = {}) => {
  if (!deposit) return null;
  if (deposit.status === "refunded") return "REFUNDED";
  if (deposit.status === "locked") return "PAID";
  if (deposit.required) return "REQUIRED";
  return null;
};

export const candidateService = {
  async getProfile(candidateId) {
    // If candidateId looks like an address, return a minimal profile for it
    if (candidateId && candidateId.startsWith("0x")) {
        // Try to find if we have mock data, else return fresh profile
        const normalized = normalizeAddress(candidateId);
        const profile = candidateState.find((c) => normalizeAddress(c.id) === normalized);
        if (profile) return delay({ ...profile });
        
        // Return a fresh "on-chain" style profile
        return delay({
            id: normalized,
            name: `Candidate ${normalized.slice(0, 6)}...`,
            role: "candidate",
            email: "",
            walletAddress: normalized
        });
    }

    const normalized = normalizeAddress(candidateId);
    const profile = candidateState.find((c) => normalizeAddress(c.id) === normalized) || null;
    return delay(profile ? { ...profile } : null);
  },
  async getCandidateProfile(candidateId) {
    return this.getProfile(candidateId);
  },
  async getCredentials(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const ledger = await depositService.list();
    const items = credentialState
      .filter((c) => normalizeAddress(c.candidateId) === normalized)
      .map((item) => {
        const ledgerEntry = ledger.find((d) => d.credentialRecordId === item.recordId);
        const depositStatus = ledgerEntry?.status || item.depositStatus || legacyDepositStatus(item.deposit);
        const depositAmount =
          ledgerEntry?.amount ?? item.depositAmount ?? item.deposit?.amount ?? 0;
        const depositId = ledgerEntry?.id || item.depositId || null;
        return {
          ...item,
          depositStatus,
          depositAmount,
          depositId,
        };
      });
    credentialState = credentialState.map((c) => {
      const found = items.find((i) => i.recordId === c.recordId);
      return found ? found : c;
    });
    return delay(items.map((item) => ({ ...item })));
  },
  async getAccessRequests(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const list = accessRequests.filter(
      (r) => normalizeAddress(r.candidateId) === normalized
    );
    return delay(list);
  },

  claimCredentialTransaction(credentialId, cccdHash) {
      const tx = new Transaction();
      // cccdHash from user input
      const cccdBytes = new TextEncoder().encode(cccdHash);
      
      tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::claim_credential_by_cccd`,
          arguments: [
              tx.object(REGISTRY_ID),
              tx.pure.u64(credentialId),
              tx.pure.vector("u8", Array.from(cccdBytes)),
              tx.pure.u64(Date.now())
          ]
      });
      return tx;
  },
  
  submitSelfDeclaredCredentialTransaction(issuerId, type, dataHash, ownerAddr) {
      const tx = new Transaction();
      const typeBytes = new TextEncoder().encode(type);
      const dataBytes = new TextEncoder().encode(dataHash);

      tx.moveCall({
         target: `${PACKAGE_ID}::${MODULE_NAME}::submit_credential_by_user_noncoop`,
         arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.u64(issuerId), // Non-coop issuer ID logic required
            tx.pure.vector("u8", Array.from(typeBytes)),
            tx.pure.address(ownerAddr),
            tx.pure.vector("u8", Array.from(dataBytes)),
            tx.pure.u64(Date.now())
         ]
      });
      return tx;
  },

  async linkIdentityDemoAndClaim(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const index = candidateState.findIndex((c) => normalizeAddress(c.id) === normalized);
    if (index < 0) {
      return delay(null);
    }

    const current = candidateState[index];
    const cccdHashRef =
      current.cccdHashRef || `hash_cccd_${normalized.slice(-4)}_${Date.now()}`;
    const updatedCandidate = {
      ...current,
      hasCCCD: true,
      cccdHashRef,
    };
    candidateState = candidateState.map((c, idx) => (idx === index ? updatedCandidate : c));

    const claimed = [];
    credentialState = credentialState.map((cred) => {
      if (normalizeAddress(cred.candidateId) !== normalized) return cred;
      if (!cred.boundToIdentityRef) return cred;
      const updated = {
        ...cred,
        boundToIdentityRef: false,
        recipientType: "CANDIDATE_ID",
        ownerCandidateId: updatedCandidate.id,
      };
      claimed.push(updated);
      return updated;
    });

    return delay({ profile: { ...updatedCandidate }, claimed });
  },
  async claimCredential(recordId, walletAddress) {
    let updated = null;
    credentialState = credentialState.map((cred) => {
      if (cred.recordId !== recordId) return cred;
      updated = {
        ...cred,
        ownerAddress: walletAddress,
        recipientType: "CANDIDATE_ID",
        boundToIdentityRef: false,
      };
      return updated;
    });
    return delay(updated);
  },
  async addExternalCredential({
    candidateId,
    issuerId,
    issuerName,
    issuerVerified,
    certId,
    walrusFile,
    walletAddress,
    depositStatus = "REQUIRED",
    depositId = null,
    depositAmount = 0,
    idCheckStatus = "NOT_RUN",
    storageRef = null,
  }) {
    const recordId = `EXT-${Math.floor(Math.random() * 9000 + 1000)}`;
    const baseAmount = Number(depositAmount || 0);
    let ledgerEntry = depositId ? await depositService.getById(depositId) : null;

    if (ledgerEntry && !ledgerEntry.credentialRecordId) {
      ledgerEntry = await depositService.linkDepositToCredential(ledgerEntry.id, recordId);
    }

    if (!ledgerEntry && depositStatus) {
      const created = await depositService.createRequiredDeposit({
        candidateAddress: walletAddress,
        issuerId,
        credentialRecordId: recordId,
        amount: baseAmount,
      });
      ledgerEntry = created;
      if (depositStatus === "PAID") {
        ledgerEntry = await depositService.payDeposit({
          depositId: created.id,
          candidateAddress: walletAddress,
          issuerId,
          credentialRecordId: recordId,
          amount: baseAmount || created.amount,
        });
      }
    }

    const finalDepositStatus = ledgerEntry?.status || depositStatus || "REQUIRED";
    const finalDepositAmount = ledgerEntry?.amount ?? baseAmount;

    const newCredential = {
      recordId,
      candidateId,
      issuerId,
      issuerName,
      issuerVerified,
      issuerType: issuerVerified ? "CO" : "NON_CO",
      type: "External credential",
      level: "N/A",
      issuedAt: new Date().toISOString(),
      status: issuerVerified ? "ISSUED" : "PENDING",
      visibility: "private",
      category: "verified",
      sensitive: false,
      proofUrl: "#",
      recipientType: walletAddress ? "CANDIDATE_ID" : "CCCD_HASH",
      ownerCandidateId: walletAddress ? candidateId : null,
      ownerAddress: walletAddress || null,
      cccdHashRef: walletAddress ? null : `hash_cccd_${recordId}`,
      walrusFiles: walrusFile ? [walrusFile] : [],
      storageRef: storageRef || walrusFile?.id || null,
      nonCoopCertCheck: { certId, result: issuerVerified ? "success" : "unknown", checkedAt: new Date().toISOString() },
      depositStatus: finalDepositStatus,
      depositAmount: finalDepositAmount,
      depositId: ledgerEntry?.id || depositId || null,
      idCheckStatus,
    };
    credentialState = [newCredential, ...credentialState];
    return delay({ ...newCredential });
  },
  async checkCertId(certId) {
    const res = await verificationService.checkIdOnCert(certId);
    return delay({ certId, result: res.status });
  },
  async markIssuerVerified(issuerId) {
    const result = await depositService.refundDepositsByIssuer(issuerId);
    const ledger = await depositService.list();
    credentialState = credentialState.map((cred) => {
      if (normalizeAddress(cred.issuerId) !== normalizeAddress(issuerId)) return cred;
      const entry = ledger.find((d) => d.credentialRecordId === cred.recordId);
      if (!entry) return { ...cred, issuerVerified: true };
      return {
        ...cred,
        issuerVerified: true,
        depositStatus: entry.status,
        depositAmount: entry.amount ?? cred.depositAmount,
        depositId: entry.id || cred.depositId,
      };
    });
    return result;
  },
};
