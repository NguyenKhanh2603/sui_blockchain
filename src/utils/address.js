export const normalizeAddress = (v = "") => (v || "").trim().toLowerCase();

export const normalizeSlushAddress = (input = "") => {
  const cleaned = normalizeAddress(input).replace(/^0x/, "");
  if (!cleaned) return "";
  const padded = cleaned.padStart(64, "0").slice(-64);
  return `0x${padded}`;
};

export const isValidSlushAddress = (addr = "") => /^0x[a-f0-9]{64}$/.test(addr || "");

export const isValidSuiAddressStrict = (v) => {
  const normalized = normalizeSlushAddress(v);
  return normalized ? isValidSlushAddress(normalized) : false;
};

export const maskAddress = (v) => {
  const normalized = normalizeSlushAddress(v);
  return isValidSlushAddress(normalized) ? `${normalized.slice(0, 6)}...${normalized.slice(-4)}` : normalizeAddress(v);
};

export const formatAddress = (v) => {
  const normalized = normalizeSlushAddress(v);
  if (!isValidSlushAddress(normalized)) return normalizeAddress(v);
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
};
