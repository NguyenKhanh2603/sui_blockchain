// @ts-nocheck
import { normalizeAddress } from "../utils/address";
import { walletService } from "./walletService";

const LEDGER_KEY = "verifyme.deposits";
const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const loadLedger = () => {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_err) {
    return [];
  }
};

const persistLedger = (entries) => {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
  return entries;
};

const findDepositById = (ledger, depositId) => ledger.find((d) => d.id === depositId);

export const depositService = {
  async list() {
    await delay(100);
    return loadLedger();
  },

  async getById(depositId) {
    const ledger = loadLedger();
    return ledger.find((d) => d.id === depositId) || null;
  },

  async getByCredential(credentialRecordId) {
    const ledger = loadLedger();
    return ledger.find((d) => d.credentialRecordId === credentialRecordId) || null;
  },

  async createRequiredDeposit({ candidateAddress, issuerId, credentialRecordId, amount = 0 }) {
    const normalized = normalizeAddress(candidateAddress);
    const ledger = loadLedger();
    const existing = credentialRecordId
      ? ledger.find((d) => d.credentialRecordId === credentialRecordId)
      : null;
    if (existing) return existing;
    const entry = {
      id: `dep_${Date.now()}`,
      candidateAddress: normalized,
      issuerId,
      credentialRecordId: credentialRecordId || null,
      amount: Number(amount) || 0,
      status: "REQUIRED",
      createdAt: new Date().toISOString(),
    };
    persistLedger([...ledger, entry]);
    await delay();
    return entry;
  },

  async payDeposit({ depositId, candidateAddress, issuerId, credentialRecordId, amount = 0 }) {
    const normalized = normalizeAddress(candidateAddress);
    let ledger = loadLedger();
    let entry = depositId ? findDepositById(ledger, depositId) : null;
    if (!entry) {
      entry = await this.createRequiredDeposit({ candidateAddress: normalized, issuerId, credentialRecordId, amount });
      ledger = loadLedger();
    }
    const updated = {
      ...entry,
      candidateAddress: normalized,
      issuerId: issuerId || entry.issuerId,
      credentialRecordId: credentialRecordId || entry.credentialRecordId,
      amount: Number(amount || entry.amount || 0),
      status: "PAID",
      paidAt: new Date().toISOString(),
    };
    const nextLedger = ledger.map((d) => (d.id === updated.id ? updated : d));
    persistLedger(nextLedger);
    await delay();
    return updated;
  },

  async linkDepositToCredential(depositId, credentialRecordId) {
    let ledger = loadLedger();
    const entry = findDepositById(ledger, depositId);
    if (!entry) return null;
    const updated = { ...entry, credentialRecordId };
    ledger = ledger.map((d) => (d.id === depositId ? updated : d));
    persistLedger(ledger);
    await delay(80);
    return updated;
  },

  async refundDepositsByIssuer(issuerId) {
    const normalizedIssuer = (issuerId || "").toLowerCase();
    let ledger = loadLedger();
    const targets = ledger.filter(
      (d) => (d.issuerId || "").toLowerCase() === normalizedIssuer && d.status === "PAID"
    );
    if (!targets.length) {
      await delay(100);
      return { refundedCount: 0, totalAmount: 0, affectedCandidates: [] };
    }
    const pendingIds = new Set(targets.map((t) => t.id));
    ledger = ledger.map((d) => (pendingIds.has(d.id) ? { ...d, status: "REFUND_PENDING" } : d));
    persistLedger(ledger);
    await delay(200);

    let totalAmount = 0;
    const affected = new Set();
    for (const entry of targets) {
      const amount = Number(entry.amount || 0);
      totalAmount += amount;
      if (entry.candidateAddress) {
        affected.add(entry.candidateAddress);
        try {
          await walletService.adjustBalance(entry.candidateAddress, amount);
        } catch (_err) {
          // ignore balance errors to keep refunds non-blocking
        }
      }
    }

    ledger = loadLedger().map((d) =>
      pendingIds.has(d.id) ? { ...d, status: "REFUNDED", refundedAt: new Date().toISOString() } : d
    );
    persistLedger(ledger);
    await delay(160);

    return {
      refundedCount: targets.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      affectedCandidates: Array.from(affected),
    };
  },
};
