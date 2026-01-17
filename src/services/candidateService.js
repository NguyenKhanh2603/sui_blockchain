import { candidates as candidateMocks } from "../mocks/candidates";
import { credentials as credentialMocks } from "../mocks/credentials";
import { accessRequests } from "../mocks/requests";
import { normalizeAddress } from "../utils/address";
import { walletService } from "./walletService";

const delay = (data, ms = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

let candidateState = candidateMocks.map((candidate) => ({ ...candidate }));
let credentialState = credentialMocks.map((credential) => ({ ...credential }));

export const candidateService = {
  async getProfile(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const profile = candidateState.find((c) => normalizeAddress(c.id) === normalized) || null;
    return delay(profile ? { ...profile } : null);
  },
  async getCandidateProfile(candidateId) {
    return this.getProfile(candidateId);
  },
  async getCredentials(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const items = credentialState
      .filter((c) => normalizeAddress(c.candidateId) === normalized)
      .map((item) => {
        if (item.deposit && item.deposit.status === "locked" && item.issuerVerified) {
          walletService.refund(item.deposit.amount || 0);
          return { ...item, deposit: { ...item.deposit, status: "refunded" } };
        }
        return item;
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
  async addExternalCredential({ candidateId, issuerId, issuerName, issuerVerified, certId, walrusFile, walletAddress }) {
    const needsDeposit = !issuerVerified;
    const deposit = needsDeposit ? { required: true, amount: 50, status: "locked" } : { required: false, amount: 0, status: "refunded" };
    if (needsDeposit) {
      await walletService.deposit(deposit.amount);
    }
    const recordId = `EXT-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newCredential = {
      recordId,
      candidateId,
      issuerId,
      issuerName,
      issuerVerified,
      type: "External credential",
      level: "N/A",
      issuedAt: new Date().toISOString(),
      status: needsDeposit ? "PENDING" : "ISSUED",
      visibility: "private",
      category: "verified",
      sensitive: false,
      proofUrl: "#",
      recipientType: walletAddress ? "CANDIDATE_ID" : "CCCD_HASH",
      ownerCandidateId: walletAddress ? candidateId : null,
      ownerAddress: walletAddress || null,
      cccdHashRef: walletAddress ? null : `hash_cccd_${recordId}`,
      walrusFiles: walrusFile ? [walrusFile] : [],
      nonCoopCertCheck: { certId, result: issuerVerified ? "success" : "unknown", checkedAt: new Date().toISOString() },
      deposit,
    };
    credentialState = [newCredential, ...credentialState];
    return delay({ ...newCredential });
  },
  async checkCertId(certId) {
    const res = ["success", "fail", "unknown"][Math.floor(Math.random() * 3)];
    return delay({ certId, result: res });
  },
  markIssuerVerified(issuerId) {
    let refunded = 0;
    credentialState = credentialState.map((cred) => {
      if (normalizeAddress(cred.issuerId) !== normalizeAddress(issuerId)) return cred;
      const needsRefund = cred.deposit?.required && cred.deposit.status === "locked";
      if (needsRefund) {
        walletService.refund(cred.deposit.amount || 0);
        refunded += 1;
      }
      return {
        ...cred,
        issuerVerified: true,
        deposit: needsRefund ? { ...cred.deposit, status: "refunded" } : cred.deposit,
      };
    });
    return refunded;
  },
};
