// @ts-nocheck
const delay = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));

export const verificationService = {
  async checkIdOnCert(storageRef) {
    await delay();
    const matched = Math.random() > 0.35;
    return {
      storageRef,
      status: matched ? "MATCHED" : "UNMATCHED",
      checkedAt: new Date().toISOString(),
    };
  },
};
