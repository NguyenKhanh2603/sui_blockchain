export const issuerProfile = {
  id: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab",
  issuerId: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab",
  orgName: "Atlas University",
  issuerType: "COOP",
  verificationLevel: 1,
  issuerVerified: false,
  status: "ACTIVE",
  statusVerified: true,
  website: "https://atlas.edu",
  supportEmail: "support@atlas.edu",
  sla: "Response in < 24h",
  policy: "We validate student records and maintain privacy-forward policies.",
  environment: "Test",
  domain: "atlas.edu",
  dnsProof: { recordId: "DNS-7781", domainHash: "hash_dns_atlas_123" },
  legalProof: null,
  legalStatus: "pending",
  proofs: [
    { method: "DNS", proofId: "DNS-7781", proofHash: "hash_dns_atlas_123", status: "VERIFIED", submittedAt: "2024-12-08T10:00:00Z" },
  ],
};

export const issuerTeam = [
  { id: "staff-1", name: "Duy Le", role: "Admin", active: true },
  { id: "staff-2", name: "Jenny Pham", role: "Issuer Staff", active: true },
  { id: "staff-3", name: "Khai Bui", role: "Auditor", active: false },
];
