const delay = (data, ms = 400) => new Promise((resolve) => setTimeout(() => resolve(data), ms));

let settings = {
  orgName: "Atlas University",
  logo: "https://api.dicebear.com/7.x/shapes/svg?seed=Atlas",
  website: "https://atlas.edu",
  policy: "We only publish verification records after internal QA and consent.",
  supportContact: "support@atlas.edu",
  workingHours: "Mon-Fri, 9:00 - 18:00",
  sla: "Responses under 24h",
  public: true,
};

export const trustService = {
  async getSettings() {
    return delay(settings);
  },
  async updateSettings(payload) {
    settings = { ...settings, ...payload };
    return delay(settings);
  },
};
