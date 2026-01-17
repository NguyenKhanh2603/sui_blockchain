export const candidateIdRegex = /^0x[a-fA-F0-9]{1,64}$/;

export function isValidCandidateId(value = "") {
  return candidateIdRegex.test(value.trim());
}
