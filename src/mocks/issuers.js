export const issuerProfile = {
  id: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab",
  orgName: "Atlas University",
  issuer_type: "COOP",
  verification_level: 1,
  status: "ACTIVE",
  statusVerified: true,
  website: "https://atlas.edu",
  supportEmail: "support@atlas.edu",
  sla: "Response in < 24h",
  policy: "We validate student records and maintain privacy-forward policies.",
  environment: "Test",
  issuerId: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab",
  domain: "atlas.edu",
  dns_proof: { recordId: "DNS-7781", domainHash: "hash_dns_atlas_123" },
  legal_proof: null,
};

export const issuerTeam = [
  { id: "staff-1", name: "Duy Le", role: "Admin", active: true },
  { id: "staff-2", name: "Jenny Pham", role: "Issuer Staff", active: true },
  { id: "staff-3", name: "Khai Bui", role: "Auditor", active: false },
];
