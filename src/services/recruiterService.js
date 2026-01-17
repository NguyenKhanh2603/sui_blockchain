import { candidates } from "../mocks/candidates";
import { credentials } from "../mocks/credentials";
import { isValidSuiAddressStrict, normalizeAddress } from "../utils/address";

const delay = (data, ms = 500) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data instanceof Error) return reject(data);
      resolve(data);
    }, ms);
  });

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
    const normalized = normalizeAddress(query);
    if (!isValidSuiAddressStrict(normalized)) {
      return delay(new Error("Invalid Candidate ID"));
    }
    const candidate = candidates.find(
      (c) => normalizeAddress(c.id) === normalized
    );
    if (!candidate) {
      return delay(new Error("Candidate not found"));
    }
    return delay(candidate);
  },
  async getCandidateCredentials(candidateId) {
    const normalized = normalizeAddress(candidateId);
    return delay(
      credentials.filter((c) => normalizeAddress(c.candidateId) === normalized)
    );
  },
};
