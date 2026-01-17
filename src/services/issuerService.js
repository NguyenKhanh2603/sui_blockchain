import { credentials } from "../mocks/credentials";
import { issuanceRequests } from "../mocks/requests";
import { issuerProfile, issuerTeam } from "../mocks/issuers";
import { auditLogs } from "../mocks/auditLogs";
import { verificationEvents as baseVerificationEvents } from "../mocks/verificationEvents";

const delay = (data, ms = 600) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

let requestsState = [...issuanceRequests];
let issuedRecords = credentials.filter((c) => c.category === "verified");
let verificationEvents = [...baseVerificationEvents];
let complianceFiles = [
  { id: "file-1", name: "KYB-Atlas.pdf", status: "approved", uploadedAt: "2024-12-05" },
  { id: "file-2", name: "SOC2-summary.pdf", status: "pending", uploadedAt: "2024-12-08" },
];
let revocationHistory = [
  { recordId: "REC-3102", reason: "Data correction", timestamp: "2024-12-02", performedBy: "Jenny Pham" },
];
let profileState = { ...issuerProfile };

export const issuerService = {
  async getIssuerProfile() {
    return delay(profileState);
  },
  async getStatus() {
    return delay(profileState);
  },
  async getOverview() {
    const pending = requestsState.filter((r) => r.status === "pending").length;
    const issued = issuedRecords.length;
    const active = issuedRecords.filter((r) => r.status === "active").length;
    const revoked = issuedRecords.filter((r) => r.status === "revoked").length;
    const activity = auditLogs.slice(0, 5);
    return delay({ pending, issued, active, revoked, activity });
  },
  async getRequests() {
    return delay(requestsState);
  },
  async approveRequest(requestId) {
    const target = requestsState.find((r) => r.requestId === requestId);
    if (target) {
      target.status = "approved";
      const newRecord = {
        recordId: `VR-${Math.floor(Math.random() * 9000 + 1000)}`,
        candidateId: target.candidateId,
        issuerId: issuerProfile.id,
        issuerName: issuerProfile.orgName,
        type: target.type,
        level: target.level,
        issuedAt: new Date().toISOString(),
        status: "active",
        visibility: "public",
        category: "verified",
        sensitive: false,
        proofUrl: "https://example.com/verification",
      };
      issuedRecords = [newRecord, ...issuedRecords];
      return delay(newRecord);
    }
    return delay(null);
  },
  async rejectRequest(requestId, reason = "Other") {
    const target = requestsState.find((r) => r.requestId === requestId);
    if (target) {
      target.status = "rejected";
      target.reason = reason;
    }
    return delay(target);
  },
  async issueCertificate(payload) {
    const newRecordId = `REC-${Math.floor(Math.random() * 9000 + 1000)}`;
    const recipientType = payload.recipientType || "CANDIDATE";
    const newEvent = {
      id: `EV-${Math.floor(Math.random() * 9000 + 1000)}`,
      credentialId: newRecordId,
      action: "ISSUE",
      method: "SYSTEM",
      result: "success",
      timestamp: new Date().toISOString(),
    };
    const newRecord = {
      recordId: newRecordId,
      issuerId: profileState.id,
      issuerName: profileState.orgName,
      status: "issued",
      visibility: "public",
      category: "verified",
      sensitive: false,
      proofUrl: "https://example.com/verification",
      issuedAt: new Date().toISOString(),
      recipientType,
      ownerCandidateId: recipientType === "CANDIDATE" ? payload.ownerCandidateId : null,
      cccdHash: recipientType === "IDENTITY_REF" ? payload.cccdHash : null,
      dataHash: payload.dataHash || `hash_${newRecordId}`,
      ...payload,
    };
    issuedRecords = [newRecord, ...issuedRecords];
    verificationEvents = [newEvent, ...verificationEvents];
    return delay(newRecord);
  },
  async getIssuedRecords(filters = {}) {
    const { status, type, recipientType } = filters;
    let list = [...issuedRecords];
    if (status) list = list.filter((r) => r.status === status);
    if (type) list = list.filter((r) => r.type === type);
    if (recipientType) list = list.filter((r) => r.recipientType === recipientType);
    return delay(list);
  },
  async getIssuedRecord(recordId) {
    const record = issuedRecords.find((r) => r.recordId === recordId);
    const events = verificationEvents.filter((e) => e.credentialId === recordId);
    return delay({ ...record, events });
  },
  async revokeRecord(recordId, reason = "Other") {
    issuedRecords = issuedRecords.map((r) =>
      r.recordId === recordId ? { ...r, status: "revoked" } : r
    );
    revocationHistory = [
      { recordId, reason, timestamp: new Date().toISOString(), performedBy: "System" },
      ...revocationHistory,
    ];
    verificationEvents = [
      {
        id: `EV-${Math.floor(Math.random() * 9000 + 1000)}`,
        credentialId: recordId,
        action: "REVOKE",
        method: "SYSTEM",
        result: reason,
        timestamp: new Date().toISOString(),
      },
      ...verificationEvents,
    ];
    return delay(true);
  },
  async getRevocationHistory() {
    return delay(revocationHistory);
  },
  async getComplianceFiles() {
    return delay(complianceFiles);
  },
  async uploadComplianceFile(fileName) {
    const next = {
      id: `file-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: fileName,
      status: "pending",
      uploadedAt: new Date().toISOString(),
    };
    complianceFiles = [next, ...complianceFiles];
    return delay(next);
  },
  async getTeam() {
    return delay(issuerTeam);
  },
  async getAuditLogs() {
    return delay(auditLogs);
  },
  async startDomainVerification(domain) {
    profileState = { ...profileState, domain };
    const token = `_verify.${domain}`;
    const host = `_verifyme.${domain}`;
    return delay({ domain, host, token });
  },
  async checkDomainVerification(domain) {
    const proof = {
      recordId: `DNS-${Math.floor(Math.random() * 9000 + 1000)}`,
      domainHash: `hash_${domain}`,
    };
    profileState = {
      ...profileState,
      verification_level: Math.max(profileState.verification_level, 1),
      dns_proof: proof,
    };
    return delay(profileState);
  },
  async submitLegalDocs() {
    profileState = { ...profileState, legalStatus: "under_review" };
    return delay(profileState);
  },
  async approveLegalVerificationDemo() {
    const proof = {
      recordId: `LEGAL-${Math.floor(Math.random() * 9000 + 1000)}`,
      legalDocHash: `hash_legal_${Date.now()}`,
    };
    profileState = {
      ...profileState,
      verification_level: 2,
      legalStatus: "approved",
      legal_proof: proof,
    };
    return delay(profileState);
  },
  async listIssuedCredentials(filters = {}) {
    return this.getIssuedRecords(filters);
  },
  async getCredentialDetail(recordId) {
    return this.getIssuedRecord(recordId);
  },
  async revokeCredential(recordId, reason = "Other") {
    return this.revokeRecord(recordId, reason);
  },
};
