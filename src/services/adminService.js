import { reviewState } from "../state/reviewState";
import { issuerService } from "./issuerService";
import { recruiterService } from "./recruiterService";
import { candidateService } from "./candidateService";

const delay = (data, ms = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const normalize = (value = "") => value.toLowerCase().trim();
const randomId = (prefix) => `${prefix}-${Math.floor(Math.random() * 9000 + 1000)}`;

export const adminService = {
  async listSubmissions(filters = {}) {
    const { roleType, status, search } = filters;
    const needle = normalize(search);
    const list = reviewState.listSubmissions().filter((s) => {
      const matchesRole = roleType ? s.roleType === roleType : true;
      const matchesStatus = status ? s.status === status : true;
      const matchesSearch = needle
        ? normalize(s.entityName).includes(needle) || normalize(s.email || "").includes(needle)
        : true;
      return matchesRole && matchesStatus && matchesSearch;
    });
    return delay(list);
  },
  async getSubmissionDetail(submissionId) {
    return delay(reviewState.getSubmission(submissionId));
  },
  async approveSubmission(submissionId) {
    const updated = reviewState.updateSubmission(submissionId, (s) => ({
      ...s,
      status: "APPROVED",
      proof: { recordId: randomId("LEGAL"), hash: `hash_${submissionId}` },
    }));
    if (!updated) return delay(null);

    let refundResult = { refundedCount: 0 };
    if (updated.roleType === "ISSUER") {
      issuerService.applyLegalApproval(updated.proof, "approved");
      await issuerService.setIssuerVerified(updated.entityId, true);
      refundResult = await candidateService.markIssuerVerified(updated.entityId);
    }
    if (updated.roleType === "RECRUITER") {
      recruiterService.applyVerificationApproval(updated.proof?.recordId || randomId("PROOF"));
    }
    reviewState.addAuditLog({
      actor: "Admin",
      action: "APPROVED",
      targetId: submissionId,
      result: "approved",
      note: updated.roleType,
    });
    return delay({ ...updated, refunds: refundResult?.refundedCount || 0 });
  },
  async rejectSubmission(submissionId, reason = "Rejected", note = "") {
    const updated = reviewState.updateSubmission(submissionId, (s) => ({
      ...s,
      status: "REJECTED",
      note: note || s.notes,
      reason,
    }));
    if (!updated) return delay(null);
    if (updated.roleType === "ISSUER") {
      issuerService.applyLegalRejection(reason);
    }
    reviewState.addAuditLog({
      actor: "Admin",
      action: "REJECTED",
      targetId: submissionId,
      result: reason,
      note,
    });
    return delay(updated);
  },
  async requestUpdate(submissionId, note = "Needs update") {
    const updated = reviewState.updateSubmission(submissionId, (s) => ({
      ...s,
      status: "NEEDS_UPDATE",
      note,
    }));
    if (!updated) return delay(null);
    if (updated.roleType === "ISSUER") {
      issuerService.applyLegalNeedsUpdate(note);
    }
    reviewState.addAuditLog({
      actor: "Admin",
      action: "NEEDS_UPDATE",
      targetId: submissionId,
      result: note,
    });
    return delay(updated);
  },
  async listAdminAuditLogs(filters = {}) {
    const { targetId } = filters;
    const list = reviewState.listAuditLogs().filter((log) =>
      targetId ? log.targetId === targetId : true
    );
    return delay(list);
  },
};
