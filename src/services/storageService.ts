// @ts-nocheck
const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));

export const storageService = {
  async uploadFile(file) {
    if (!file) return null;
    await delay();
    const id = `file_${Date.now()}`;
    return {
      id,
      hash: `hash_${id}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  },
};
