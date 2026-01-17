let currentAddress = null;

const randomHex = () => {
  const chars = "abcdef0123456789";
  let out = "0x";
  for (let i = 0; i < 64; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const walletService = {
  detectProvider() {
    return true;
  },
  async connect() {
    if (!this.detectProvider()) throw new Error("provider_missing");
    currentAddress = randomHex();
    return { address: currentAddress };
  },
  async disconnect() {
    currentAddress = null;
    return true;
  },
  async getAddress() {
    return currentAddress;
  },
  async deposit(amount = 0) {
    return { depositId: `dep_${Date.now()}`, amount };
  },
  async refund(amount = 0) {
    return { refundId: `ref_${Date.now()}`, amount };
  },
};
