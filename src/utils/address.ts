// @ts-nocheck
const HEX_64 = /^[a-f0-9]{64}$/;

export const isStrictAddress = (input = "") => {
  const normalized = (input || "").trim().toLowerCase();
  if (!normalized) return false;
  const stripped = normalized.startsWith("0x") ? normalized.slice(2) : normalized;
  return HEX_64.test(stripped);
};

export const normalizeAddress = (input = "") => {
  const cleaned = (input || "").trim().toLowerCase();
  if (!cleaned) return "";
  const stripped = cleaned.replace(/^0x/, "");
  if (!stripped || stripped.length > 64) return "";
  const padded = stripped.padStart(64, "0");
  const full = `0x${padded}`;
  return isStrictAddress(full) ? full : "";
};

export const shortAddress = (addr = "") => {
  const normalized = normalizeAddress(addr);
  if (!normalized) return (addr || "").trim();
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
};

// Backwards-compatible helpers
export const normalizeSlushAddress = normalizeAddress;
export const isValidSlushAddress = isStrictAddress;
export const isValidSuiAddressStrict = isStrictAddress;

export const maskAddress = (value) => {
  const normalized = normalizeAddress(value);
  return isStrictAddress(normalized) ? `${normalized.slice(0, 6)}...${normalized.slice(-4)}` : (value || "").trim().toLowerCase();
};

export const formatAddress = (value) => shortAddress(value);
