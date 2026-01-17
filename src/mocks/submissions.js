export const submissions = [
  {
    submissionId: "SUB-1001",
    entityId: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab",
    entityName: "Atlas University",
    roleType: "ISSUER",
    status: "PENDING",
    submittedAt: "2024-12-08T10:00:00Z",
    email: "compliance@atlas.edu",
    files: [
      { name: "kyb-atlas.pdf", url: "https://example.com/kyb-atlas.pdf" },
      { name: "legal-opinion.pdf", url: "https://example.com/legal-opinion.pdf" },
    ],
    notes: "Initial submission for legal verification.",
  },
  {
    submissionId: "SUB-1002",
    entityId: "recruiter-01",
    entityName: "NovaHire",
    roleType: "RECRUITER",
    status: "APPROVED",
    submittedAt: "2024-12-07T09:30:00Z",
    email: "trust@novahire.com",
    files: [
      { name: "novahire-soc2.pdf", url: "https://example.com/novahire-soc2.pdf" },
    ],
    notes: "SOC2 summary provided.",
  },
  {
    submissionId: "SUB-1003",
    entityId: "issuer-noncoop-01",
    entityName: "GrowthCert",
    roleType: "ISSUER",
    status: "NEEDS_UPDATE",
    submittedAt: "2024-12-06T16:10:00Z",
    email: "ops@growthcert.com",
    files: [
      { name: "kyb-growthcert.pdf", url: "https://example.com/kyb-growthcert.pdf" },
    ],
    notes: "Please include latest registration.",
  },
];
