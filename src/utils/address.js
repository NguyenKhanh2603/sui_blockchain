export const normalizeAddress = (v) => (v || "").trim().toLowerCase();

export const isValidSuiAddressStrict = (v) =>
  /^0x[a-f0-9]{64}$/.test(normalizeAddress(v));

export const maskAddress = (v) => {
  const n = normalizeAddress(v);
  return isValidSuiAddressStrict(n) ? `${n.slice(0, 6)}...${n.slice(-4)}` : n;
};

export const formatAddress = (v) => {
  const n = normalizeAddress(v);
  if (!isValidSuiAddressStrict(n)) return n;
  return `${n.slice(0, 6)}...${n.slice(-4)}`;
};
