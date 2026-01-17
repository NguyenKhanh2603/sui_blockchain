import { candidates } from "../mocks/candidates";
import { credentials } from "../mocks/credentials";
import { reviewState } from "../state/reviewState";
import { isValidSuiAddressStrict, normalizeSlushAddress } from "../utils/address";

const delay = (data, ms = 500) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data instanceof Error) return reject(data);
      resolve(data);
    }, ms);
  });

const randomId = (prefix) => `${prefix}-${Math.floor(Math.random() * 9000 + 1000)}`;
let recruiterProfileState = {
  id: "recruiter-01",
  name: "Nova Recruiter",
  orgName: "NovaHire",
  verifiedStatus: false,
  email: "trust@novahire.com",
};
let jobsState = [
  {
    id: "job-1",
    title: "Product Designer",
    keywords: ["design", "figma", "portfolio"],
    minTrust: 80,
    status: "active",
    updatedAt: "2024-12-10T10:00:00Z",
  },
  {
    id: "job-2",
    title: "Backend Engineer",
    keywords: ["node", "api", "sql"],
    minTrust: 0,
    status: "expired",
    updatedAt: "2024-12-08T08:00:00Z",
  },
  {
    id: "job-3",
    title: "Risk Analyst",
    keywords: ["risk", "data", "sql"],
    minTrust: 70,
    status: "draft",
    updatedAt: "2024-12-06T10:00:00Z",
  },
];

export const recruiterService = {
  async getRecentCandidates() {
    const statuses = ["verified", "pending", "locked"];
    const list = candidates.map((c, idx) => ({
      ...c,
      status: statuses[idx % statuses.length],
      lastAction: c.recentViewedAt,
    }));
    return delay(list);
  },
  async searchCandidate(query) {
    const normalized = normalizeSlushAddress(query);
    if (!isValidSuiAddressStrict(normalized)) {
      return delay(new Error("Invalid Candidate ID"));
    }
    const candidate = candidates.find(
      (c) => normalizeSlushAddress(c.id) === normalized
    );
    if (!candidate) {
      return delay(new Error("Candidate not found"));
    }
    return delay(candidate);
  },
  async getCandidateCredentials(candidateId) {
    const normalized = normalizeSlushAddress(candidateId);
    return delay(
      credentials.filter((c) => normalizeSlushAddress(c.candidateId) === normalized)
    );
  },
  async searchCandidatesByIdOrUsername(query = "") {
    const normalizedId = normalizeSlushAddress(query);
    if (isValidSuiAddressStrict(normalizedId)) {
      const match = candidates.find((c) => normalizeSlushAddress(c.id) === normalizedId);
      return delay(match ? [match] : []);
    }
    const tokens = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!tokens.length) return delay(candidates);
    const matches = candidates.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const username = (c.username || "").toLowerCase();
      return tokens.every((t) => name.includes(t) || username.includes(t));
    });
    return delay(matches);
  },
  async submitLegalDocs(files = []) {
    const submission = {
      submissionId: randomId("SUB"),
      entityId: recruiterProfileState.id,
      entityName: recruiterProfileState.orgName,
      roleType: "RECRUITER",
      status: "PENDING",
      submittedAt: new Date().toISOString(),
      email: recruiterProfileState.email,
      files: files.length ? files : [{ name: "recruiter-legal-pack.pdf", url: "" }],
      notes: "Submitted from recruiter portal",
    };
    reviewState.addSubmission(submission);
    reviewState.addAuditLog({
      actor: recruiterProfileState.orgName,
      action: "SUBMITTED_LEGAL",
      targetId: submission.submissionId,
      result: "pending",
    });
    return delay(submission);
  },
  applyVerificationApproval(proofRecordId) {
    recruiterProfileState = { ...recruiterProfileState, verifiedStatus: true, proofRecordId };
    return recruiterProfileState;
  },
  async getRecruiterProfile() {
    return delay(recruiterProfileState);
  },
  async listJobs() {
    return delay([...jobsState]);
  },
  async saveJob(job) {
    const status = job.status || "draft";
    if (job.id) {
      jobsState = jobsState.map((j) =>
        j.id === job.id ? { ...j, ...job, status, updatedAt: new Date().toISOString() } : j
      );
      return delay(jobsState.find((j) => j.id === job.id));
    }
    const created = { ...job, status, id: randomId("job"), updatedAt: new Date().toISOString() };
    jobsState = [created, ...jobsState];
    return delay(created);
  },
  async setJobStatus(jobId, status) {
    jobsState = jobsState.map((j) =>
      j.id === jobId ? { ...j, status, updatedAt: new Date().toISOString() } : j
    );
    return delay(jobsState.find((j) => j.id === jobId));
  },
  async setActiveJob(jobId) {
    return this.setJobStatus(jobId, "active");
  },
  async getActiveJob() {
    return delay(jobsState.find((j) => j.status === "active") || null);
  },
  async getActiveJobs() {
    return delay(jobsState.filter((j) => j.status === "active"));
  },
  async recommendedCandidatesForJob(job) {
    if (!job) return delay([]);
    const keywords = (job.keywords || []).map((k) => k.toLowerCase());
    const scored = candidates.map((c) => {
      const text = `${c.bio || ""}`.toLowerCase();
      const matchCount = keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
      return { ...c, score: matchCount };
    });
    const filtered = scored
      .filter((c) => c.score > 0 && (!job.minTrust || c.trustScore >= job.minTrust))
      .sort((a, b) => b.score - a.score);
    return delay(filtered);
  },
};
