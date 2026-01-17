// @ts-nocheck
import { isStrictAddress, normalizeAddress } from "../utils/address";

const DEFAULT_BALANCE = 10;
const BALANCE_KEY = (address: string) => `verifyme.wallet.${address}.balance`;

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const getProviderCandidates = () => {
  if (typeof window === "undefined") return [];
  const maybeWindow: any = window;
  return [
    maybeWindow.__SLUSH__?.wallet,
    maybeWindow.slushWallet,
    maybeWindow.wallet,
    maybeWindow.suiWallet,
    maybeWindow.suiet,
    maybeWindow.ethos,
    maybeWindow.martian,
    maybeWindow.onekey?.sui,
  ].filter(Boolean);
};

const isProvider = (provider: any) =>
  provider &&
  (typeof provider.getAccounts === "function" ||
    typeof provider.request === "function" ||
    typeof provider.connect === "function" ||
    Array.isArray(provider.accounts));

const requestAccounts = async (provider: any) => {
  if (!provider) return [];
  if (typeof provider.connect === "function") {
    try {
      await provider.connect();
    } catch (_err) {
      // ignore connect errors and keep trying to read accounts
    }
  }
  if (typeof provider.getAccounts === "function") {
    const res = await provider.getAccounts();
    if (Array.isArray(res)) return res;
  }
  if (Array.isArray(provider.accounts)) return provider.accounts;
  if (typeof provider.request === "function") {
    const res = await provider.request({ method: "sui_accounts" });
    if (Array.isArray(res?.accounts)) return res.accounts;
    if (Array.isArray(res)) return res;
  }
  if (typeof provider.accounts === "function") {
    const res = await provider.accounts();
    if (Array.isArray(res)) return res;
  }
  return [];
};

const readBalance = (address: string) => {
  const key = BALANCE_KEY(address);
  const stored = localStorage.getItem(key);
  const parsed = stored ? Number.parseFloat(stored) : NaN;
  if (!stored || Number.isNaN(parsed)) {
    localStorage.setItem(key, DEFAULT_BALANCE.toFixed(2));
    return DEFAULT_BALANCE;
  }
  return Number(parsed.toFixed(2));
};

const writeBalance = (address: string, value: number) => {
  const next = Number(Math.max(value, 0).toFixed(2));
  localStorage.setItem(BALANCE_KEY(address), next.toFixed(2));
  return next;
};

let activeAddress = "";

export const walletService = {
  detectProvider() {
    return getProviderCandidates().find((provider) => isProvider(provider)) || null;
  },

  async connect() {
    const provider = this.detectProvider();
    if (!provider) {
      throw new Error("provider_missing");
    }
    const accounts = await requestAccounts(provider);
    const addressCandidate =
      accounts?.[0]?.address || accounts?.[0]?.walletAddress || accounts?.[0] || "";
    const normalized = normalizeAddress(addressCandidate);
    if (!isStrictAddress(normalized)) {
      activeAddress = "";
      throw new Error("invalid_address");
    }
    activeAddress = normalized;
    await delay();
    return { address: normalized, provider };
  },

  async disconnect() {
    activeAddress = "";
    await delay(100);
    return true;
  },

  async getAddress() {
    await delay(80);
    return activeAddress;
  },

  async getBalance(address: string) {
    const normalized = normalizeAddress(address || activeAddress);
    await delay(120);
    if (!normalized) return 0;
    return readBalance(normalized);
  },

  async adjustBalance(address: string, delta: number) {
    const normalized = normalizeAddress(address || activeAddress);
    if (!normalized) {
      throw new Error("address_missing");
    }
    const current = readBalance(normalized);
    const next = current + Number(delta || 0);
    if (next < 0) {
      throw new Error("insufficient_balance");
    }
    await delay(180);
    return writeBalance(normalized, next);
  },
};
