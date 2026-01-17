import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import CopyButton from "../../components/ui/CopyButton";
import { issuerService } from "../../services/issuerService";
import { normalizeAddress, isValidSuiAddressStrict, maskAddress } from "../../utils/address";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function IssueCertificate() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recipientType, setRecipientType] = useState("CANDIDATE_ID");
  const [form, setForm] = useState({
    candidateId: "",
    cccd: "",
    type: "Employment Verification",
    level: "Level I",
    expiresAt: "",
    internalRef: "",
  });
  const [issued, setIssued] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    issuerService.getIssuerProfile().then(setProfile);
  }, []);

  const issueBlocked =
    profile &&
    ((profile.issuerType === "COOP" && (profile.verificationLevel || 0) < 1) ||
      profile.issuerType === "NON_COOP");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (issueBlocked) {
      toast.error("Complete verification to issue.");
      return;
    }
    setError("");
    if (recipientType === "CANDIDATE_ID") {
      const normalized = normalizeAddress(form.candidateId);
      setForm((prev) => ({ ...prev, candidateId: normalized }));
      if (!isValidSuiAddressStrict(normalized)) {
        const msg = "Invalid Candidate ID. Use 0x + 64 hex characters.";
        setError(msg);
        toast.error(msg);
        return;
      }
    } else if (!form.cccd?.trim()) {
      const msg = "National ID (CCCD) is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const payload =
        recipientType === "CANDIDATE_ID"
          ? {
              recipientType,
              candidateId: normalizeAddress(form.candidateId),
              ownerCandidateId: normalizeAddress(form.candidateId),
            }
          : {
              recipientType: "CCCD_HASH",
              cccd: form.cccd,
              cccdMasked: `********${(form.cccd || "").slice(-4)}`,
              cccdHashRef: `hash_ref_${(form.cccd || "").slice(-4)}_${Date.now()}`,
            };

      const record = await issuerService.issueCredential({
        ...payload,
        type: form.type,
        level: form.level,
        expiresAt: form.expiresAt || null,
        internalRef: form.internalRef,
      });
      setIssued(record);
      toast.success(`Issued ${record.recordId}`);
    } catch (err) {
      toast.error("Unable to issue credential");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold text-slate-500">Issue</p>
        <h1 className="text-2xl font-bold text-slate-900">Issue credential</h1>
        <Card className="p-4 text-sm text-slate-600">Loading issuer profile…</Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Issue</p>
        <h1 className="text-2xl font-bold text-slate-900">Issue credential</h1>
      </div>

      {issueBlocked && (
        <Card className="p-4 border-amber-200 bg-amber-50 text-amber-800">
          {profile.issuerType === "COOP"
            ? "Complete domain verification to issue credentials."
            : "Non co-op issuers require external verification. Issuing is disabled in this view."}
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={() => navigate("/issuer/verification")}>
              Go to verification
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            {["CANDIDATE_ID", "CCCD_HASH"].map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => {
                  setRecipientType(type);
                  setError("");
                }}
                className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                  recipientType === type ? "border-navy-400 bg-navy-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                {type === "CANDIDATE_ID" ? "VerifyMe user (Candidate ID)" : "Not on VerifyMe yet (National ID - CCCD)"}
              </button>
            ))}
          </div>

          {recipientType === "CANDIDATE_ID" ? (
            <Input
              label="Candidate ID"
              value={form.candidateId}
              onChange={(e) => {
                setForm({ ...form, candidateId: e.target.value });
                setError("");
              }}
              onBlur={() => {
                const normalized = normalizeAddress(form.candidateId);
                setForm((prev) => ({ ...prev, candidateId: normalized }));
                setError(
                  normalized && !isValidSuiAddressStrict(normalized)
                    ? "Invalid Candidate ID. Use 0x + 64 hex characters."
                    : ""
                );
              }}
              placeholder="0x..."
              suffix={
                isValidSuiAddressStrict(normalizeAddress(form.candidateId)) ? (
                  <Badge variant="success">Valid</Badge>
                ) : null
              }
              required
            />
          ) : (
            <Input
              label="National ID (CCCD)"
              value={form.cccd}
              onChange={(e) => {
                setForm({ ...form, cccd: e.target.value });
                setError("");
              }}
              placeholder="Enter recipient CCCD"
              required
            />
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Select label="Credential type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Employment Verification</option>
              <option>Education Check</option>
              <option>Compliance</option>
            </Select>
            <Select label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Level I</option>
              <option>Level II</option>
              <option>Level III</option>
            </Select>
            <Input
              label="Expire date (optional)"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
            <Input
              label="Internal reference (optional)"
              value={form.internalRef}
              onChange={(e) => setForm({ ...form, internalRef: e.target.value })}
            />
          </div>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={loading}
              disabled={issueBlocked || (recipientType === "CANDIDATE_ID" && !isValidSuiAddressStrict(normalizeAddress(form.candidateId)))}
            >
              Issue credential
            </Button>
          </div>
        </form>
      </Card>

      {issued && (
        <Card className="p-4 border-green-200 bg-green-50 text-green-800 space-y-2">
          <p className="text-sm font-semibold">Issued successfully</p>
          <div className="flex items-center gap-2 text-sm">
            <span>Record ID: {issued.recordId}</span>
            <CopyButton value={issued.recordId} />
          </div>
          <p className="text-sm">
            Recipient:{" "}
            {issued.recipientType === "CANDIDATE_ID"
              ? maskAddress(issued.ownerCandidateId || issued.candidateId)
              : issued.cccdHashRef}
          </p>
          <p className="text-sm">Status: {issued.status?.toUpperCase?.() || "ISSUED"}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/issuer/issued/${issued.recordId}`)}>
              View record
            </Button>
            <Button variant="ghost" onClick={() => window.open(issued.proofUrl, "_blank")}>
              View verification proof
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default IssueCertificate;
