import { credentials } from "../mocks/credentials";
import { issuanceRequests } from "../mocks/requests";
import { issuerProfile, issuerTeam } from "../mocks/issuers";
import { auditLogs as auditLogMocks } from "../mocks/auditLogs";
import { verificationEvents as baseVerificationEvents } from "../mocks/verificationEvents";
import { reviewState } from "../state/reviewState";
import { depositService } from "./depositService";

const delay = (data, ms = 600) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

let profileState = { ...issuerProfile };
let requestsState = [...issuanceRequests];
let issuedRecords = [...credentials];
let verificationEvents = [...baseVerificationEvents];
let complianceFiles = [
  { id: "file-1", name: "KYB-Atlas.pdf", status: "approved", uploadedAt: "2024-12-05" },
  { id: "file-2", name: "SOC2-summary.pdf", status: "under_review", uploadedAt: "2024-12-08" },
];
let revocationHistory = [
  { recordId: "REC-3102", reason: "Data correction", timestamp: "2024-12-02T10:00:00Z", performedBy: "Jenny Pham" },
];

const issuerStorageKey = "verifyme.issuers";
const loadIssuerDirectory = () => {
  try {
    const raw = localStorage.getItem(issuerStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
};
const defaultIssuers = [
  { id: issuerProfile.id, name: issuerProfile.orgName, verified: issuerProfile.issuerVerified || false },
  { id: "0x3103103103103103103103103103103103103103103103103103103103103103", name: "GrowthCert", verified: false },
  { id: "0x5025025025025025025025025025025025025025025025025025025025025025", name: "ComplianceHub", verified: false },
];
let issuerDirectory = loadIssuerDirectory() || defaultIssuers;
const persistIssuers = () => {
  localStorage.setItem(issuerStorageKey, JSON.stringify(issuerDirectory));
  return issuerDirectory;
};

const randomId = (prefix = "REC") => `${prefix}-${Math.floor(Math.random() * 9000 + 1000)}`;
const upsertProof = (method, attrs = {}) => {
  const existing = (profileState.proofs || []).filter((p) => p.method !== method);
  profileState = {
    ...profileState,
    proofs: [
      ...existing,
      {
        method,
        proofId: attrs.proofId || attrs.recordId || randomId(method === "DNS" ? "DNS" : "LEGAL"),
        proofHash: attrs.proofHash || attrs.domainHash || attrs.legalDocHash || `hash_${Date.now()}`,
        status: attrs.status || "PENDING",
        submittedAt: attrs.submittedAt || new Date().toISOString(),
      },
    ],
  };
};

const addEvent = ({ credentialId, action, method, result }) => {
  const event = {
    id: randomId("EV"),
    credentialId,
    action,
    method,
    result,
    timestamp: new Date().toISOString(),
  };
  verificationEvents = [event, ...verificationEvents];
  return event;
};

const maskCccd = (value = "") => {
  const safe = `${value}`.trim();
  const tail = safe.slice(-4);
  const maskedPrefix = "*".repeat(Math.max(safe.length - 4, 4));
  return `${maskedPrefix}${tail}`;
};

const legalProofFor = () => ({
  recordId: randomId("LEGAL"),
  legalDocHash: `hash_legal_${Date.now()}`,
});

export const issuerService = {
  async getIssuerProfile() {
    const directoryEntry = issuerDirectory.find((i) => i.id === profileState.id);
    const verified = directoryEntry ? directoryEntry.verified : profileState.issuerVerified;
    profileState = { ...profileState, issuerVerified: verified };
    persistIssuers();
    return delay({ ...profileState, proofs: profileState.proofs || [] });
  },
  async getStatus() {
    const directoryEntry = issuerDirectory.find((i) => i.id === profileState.id);
    const verified = directoryEntry ? directoryEntry.verified : profileState.issuerVerified;
    profileState = { ...profileState, issuerVerified: verified };
    return delay(profileState);
  },
  async getOverview() {
    const issued = issuedRecords.filter((r) => r.status !== "revoked").length;
    const active = issuedRecords.filter((r) => r.status === "issued" || r.status === "verified").length;
    const revoked = issuedRecords.filter((r) => r.status === "revoked").length;
    const pending = requestsState.filter((r) => r.status === "pending").length;
    const activity = auditLogMocks.slice(0, 5);
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
        recordId: randomId("REC"),
        candidateId: target.candidateId,
        issuerId: profileState.id,
        issuerName: profileState.orgName,
        type: target.type,
        level: target.level,
        issuedAt: new Date().toISOString(),
        status: "issued",
        visibility: "public",
        category: "verified",
        sensitive: false,
        proofUrl: "https://example.com/verification",
        recipientType: "CANDIDATE_ID",
        ownerCandidateId: target.candidateId,
        dataHash: `hash_${Date.now()}`,
      };
      issuedRecords = [newRecord, ...issuedRecords];
      addEvent({ credentialId: newRecord.recordId, action: "ISSUED", method: "Portal", result: "success" });
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
  async startDnsSetup(domain) {
    if (profileState.issuerType !== "COOP") {
      return delay({ error: "DNS verification is only required for co-op issuers." });
    }
    profileState = { ...profileState, domain, dnsToken: `token_${Math.floor(Math.random() * 99999)}` };
    const host = `_verify.${domain}`;
    const value = `verify=${profileState.dnsToken}`;
    return delay({ domain, host, value });
  },
  async startDomainVerification(domain) {
    return this.startDnsSetup(domain);
  },
  async checkDns(domain) {
    if (profileState.issuerType !== "COOP") {
      return delay({ ...profileState, dnsError: "DNS verification is only for co-op issuers." });
    }
    const matchedDomain = profileState.domain && profileState.domain === domain;
    if (!matchedDomain) {
      return delay({ ...profileState, dnsError: "Domain mismatch. Update domain and try again." });
    }
    const proof = {
      recordId: randomId("DNS"),
      domainHash: `hash_${domain}`,
    };
    upsertProof("DNS", { ...proof, status: "VERIFIED" });
    profileState = {
      ...profileState,
      verificationLevel: Math.max(profileState.verificationLevel || 0, 1),
      dnsProof: proof,
      status: "ACTIVE",
      dnsError: undefined,
    };
    return delay(profileState);
  },
  async checkDomainVerification(domain) {
    return this.checkDns(domain);
  },
  async submitLegalDocs(files = []) {
    const submission = {
      submissionId: randomId("SUB"),
      entityId: profileState.id,
      entityName: profileState.orgName,
      roleType: "ISSUER",
      status: "PENDING",
      submittedAt: new Date().toISOString(),
      email: profileState.supportEmail || "legal@issuer.test",
      files: files.length ? files : [{ name: "legal-pack.pdf", url: "" }],
      notes: "Submitted from issuer portal",
    };
    reviewState.addSubmission(submission);
    reviewState.addAuditLog({
      actor: profileState.orgName,
      action: "SUBMITTED_LEGAL",
      targetId: submission.submissionId,
      result: "pending",
    });
    upsertProof("LEGAL", { status: "PENDING" });
    profileState = { ...profileState, legalStatus: "under_review", lastSubmissionId: submission.submissionId };
    return delay({ ...profileState });
  },
  async approveLegalDemo() {
    const proof = legalProofFor();
    profileState = {
      ...profileState,
      verificationLevel: 2,
      legalStatus: "approved",
      legalProof: proof,
      issuerVerified: true,
      status: "ACTIVE",
    };
    upsertProof("LEGAL", { ...proof, status: "APPROVED" });
    reviewState.updateSubmission(profileState.lastSubmissionId, (s) => ({
      ...s,
      status: "APPROVED",
      proof,
    }));
    addEvent({ credentialId: "-", action: "LEGAL_REVIEW", method: "Portal", result: "approved" });
    return delay(profileState);
  },
  async submitLegalDocsWithFiles(files = []) {
    return this.submitLegalDocs(files);
  },
  applyLegalApproval(proofOverride, note = "") {
    const proof = proofOverride || legalProofFor();
    profileState = {
      ...profileState,
      verificationLevel: 2,
      legalStatus: "approved",
      legalProof: proof,
      issuerVerified: true,
      status: "ACTIVE",
    };
    upsertProof("LEGAL", { ...proof, status: "APPROVED" });
    reviewState.addAuditLog({
      actor: "Admin",
      action: "LEGAL_APPROVED",
      targetId: profileState.id,
      result: note || "approved",
    });
    return { ...profileState };
  },
  applyLegalNeedsUpdate(note = "") {
    profileState = { ...profileState, legalStatus: "needs_update" };
    upsertProof("LEGAL", { status: "NEEDS_UPDATE" });
    reviewState.addAuditLog({
      actor: "Admin",
      action: "LEGAL_UPDATE_REQUEST",
      targetId: profileState.id,
      result: note || "needs_update",
    });
    return { ...profileState };
  },
  applyLegalRejection(reason = "") {
    profileState = { ...profileState, legalStatus: "rejected" };
    upsertProof("LEGAL", { status: "REJECTED" });
    reviewState.addAuditLog({
      actor: "Admin",
      action: "LEGAL_REJECTED",
      targetId: profileState.id,
      result: reason || "rejected",
    });
    return { ...profileState };
  },
  async issueCredential(payload) {
    const recipientType = payload.recipientType || "CANDIDATE_ID";
    const recordId = randomId("REC");
    const cccdHashRef = payload.cccdHashRef || (recipientType === "CCCD_HASH" ? `hash_${recordId}` : null);
    const cccdMasked = recipientType === "CCCD_HASH" ? payload.cccdMasked || maskCccd(payload.cccd || "0000") : null;
    const statusForIssuer =
      profileState.issuerType === "NON_COOP" ? "verified" : "issued";
    const newRecord = {
      recordId,
      issuerId: profileState.id,
      issuerName: profileState.orgName,
      status: statusForIssuer,
      visibility: "public",
      category: "verified",
      sensitive: false,
      proofUrl: "https://example.com/verification",
      issuedAt: new Date().toISOString(),
      recipientType,
      ownerCandidateId: recipientType === "CANDIDATE_ID" ? payload.ownerCandidateId || payload.candidateId : null,
      cccdHashRef,
      cccdMasked,
      dataHash: payload.dataHash || `hash_${recordId}`,
      type: payload.type,
      level: payload.level,
      expiresAt: payload.expiresAt || null,
      internalRef: payload.internalRef || "",
    };
    issuedRecords = [newRecord, ...issuedRecords];
    const method = recipientType === "CCCD_HASH" ? "Identity reference" : "Platform user";
    addEvent({
      credentialId: recordId,
      action: profileState.issuerType === "NON_COOP" ? "EXTERNAL_VERIFY" : "ISSUED",
      method,
      result: statusForIssuer.toUpperCase(),
    });
    return delay(newRecord);
  },
  async issueCertificate(payload) {
    return this.issueCredential(payload);
  },
  async listIssuedCredentials(filters = {}) {
    const { status, recipientType, from, to } = filters;
    let list = [...issuedRecords];
    if (status) list = list.filter((r) => r.status.toUpperCase() === status.toUpperCase());
    if (recipientType) list = list.filter((r) => r.recipientType === recipientType);
    if (from) list = list.filter((r) => new Date(r.issuedAt) >= new Date(from));
    if (to) list = list.filter((r) => new Date(r.issuedAt) <= new Date(to));
    return delay(list);
  },
  async getIssuedRecords(filters = {}) {
    return this.listIssuedCredentials(filters);
  },
  async getIssuedRecord(recordId) {
    return this.getCredentialDetail(recordId);
  },
  async getCredentialDetail(recordId) {
    const record = issuedRecords.find((r) => r.recordId === recordId);
    const events = verificationEvents.filter((e) => e.credentialId === recordId);
    return delay({ ...record, events });
  },
  async revokeCredential(recordId, reason = "Other") {
    issuedRecords = issuedRecords.map((r) =>
      r.recordId === recordId ? { ...r, status: "revoked" } : r
    );
    revocationHistory = [
      { recordId, reason, timestamp: new Date().toISOString(), performedBy: "System" },
      ...revocationHistory,
    ];
    addEvent({ credentialId: recordId, action: "REVOKED", method: "Portal", result: reason });
    return delay(true);
  },
  async revokeRecord(recordId, reason = "Other") {
    return this.revokeCredential(recordId, reason);
  },
  async getRevocationHistory() {
    return delay(revocationHistory);
  },
  async getComplianceFiles() {
    return delay(complianceFiles);
  },
  async uploadComplianceFile(fileName) {
    const next = {
      id: randomId("FILE"),
      name: fileName,
      status: "under_review",
      uploadedAt: new Date().toISOString(),
    };
    complianceFiles = [next, ...complianceFiles];
    return delay(next);
  },
  async getTeam() {
    return delay(issuerTeam);
  },
  async getAuditLogs(filters = {}) {
    const { action = "", method = "", result = "" } = filters;
    const logs = [...auditLogMocks, ...verificationEvents.map((e) => ({
      id: e.id,
      time: e.timestamp,
      actor: "System",
      action: e.action,
      method: e.method,
      result: e.result,
      targetId: e.credentialId,
    }))];
    return delay(
      logs.filter(
        (l) =>
          (action ? l.action === action : true) &&
          (method ? (l.method || "").toLowerCase().includes(method.toLowerCase()) : true) &&
          (result ? (l.result || "").toLowerCase().includes(result.toLowerCase()) : true)
      )
    );
  },
  async listIssuers() {
    return delay([...issuerDirectory]);
  },
  async setIssuerVerified(issuerId, verified = true) {
    issuerDirectory = issuerDirectory.map((issuer) =>
      issuer.id === issuerId ? { ...issuer, verified } : issuer
    );
    persistIssuers();
    if (profileState.id === issuerId) {
      profileState = { ...profileState, issuerVerified: verified };
    }
    return delay(issuerDirectory.find((i) => i.id === issuerId) || null);
  },
  async verifyIssuerAndRefund(issuerId) {
    const issuer = await this.setIssuerVerified(issuerId, true);
    const refund = await depositService.refundDepositsByIssuer(issuerId);
    return { issuer, refund };
  },
};
