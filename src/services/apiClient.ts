// @ts-nocheck
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  async get(url, options = {}) {
    await delay();
    return { url, options, data: null };
  },
  async post(url, body = {}, options = {}) {
    await delay();
    return { url, body, options, data: null };
  },
};
