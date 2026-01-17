import { candidates } from "../mocks/candidates";
import { credentials } from "../mocks/credentials";
import { accessRequests } from "../mocks/requests";
import { normalizeAddress } from "../utils/address";

const delay = (data, ms = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const candidateService = {
  async getProfile(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const profile = candidates.find((c) => normalizeAddress(c.id) === normalized) || null;
    return delay(profile);
  },
  async getCredentials(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const items = credentials.filter(
      (c) => normalizeAddress(c.candidateId) === normalized
    );
    return delay(items);
  },
  async getAccessRequests(candidateId) {
    const normalized = normalizeAddress(candidateId);
    const list = accessRequests.filter(
      (r) => normalizeAddress(r.candidateId) === normalized
    );
    return delay(list);
  },
};
