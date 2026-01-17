import { accessRequests } from "../mocks/requests";

let state = [...accessRequests];
const delay = (data, ms = 500) => new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const accessService = {
  async requestAccess(payload) {
    const record = {
      id: `AR-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: "pending",
      requestedAt: new Date().toISOString(),
      ...payload,
    };
    state = [record, ...state];
    return delay(record);
  },
  async updateStatus(id, status) {
    state = state.map((r) => (r.id === id ? { ...r, status } : r));
    return delay(state.find((r) => r.id === id));
  },
  async listByCandidate(candidateId) {
    return delay(state.filter((r) => r.candidateId === candidateId));
  },
};
