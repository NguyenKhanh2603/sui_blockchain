import { submissions as submissionMocks } from "../mocks/submissions";
import { adminAuditLogs as adminAuditMocks } from "../mocks/adminAuditLogs";

let submissionsState = [...submissionMocks];
let adminAuditLogsState = [...adminAuditMocks];

const randomId = (prefix) => `${prefix}-${Math.floor(Math.random() * 9000 + 1000)}`;

export const reviewState = {
  addSubmission(entry) {
    submissionsState = [entry, ...submissionsState];
    return entry;
  },
  updateSubmission(submissionId, updater) {
    let updated = null;
    submissionsState = submissionsState.map((s) => {
      if (s.submissionId !== submissionId) return s;
      updated = updater({ ...s });
      return updated;
    });
    return updated;
  },
  listSubmissions() {
    return [...submissionsState];
  },
  getSubmission(submissionId) {
    return submissionsState.find((s) => s.submissionId === submissionId) || null;
  },
  addAuditLog(entry) {
    const record = { id: entry.id || randomId("LOG"), timestamp: new Date().toISOString(), ...entry };
    adminAuditLogsState = [record, ...adminAuditLogsState];
    return record;
  },
  listAuditLogs() {
    return [...adminAuditLogsState];
  },
};
