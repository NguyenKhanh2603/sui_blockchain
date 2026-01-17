import React, { useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { issuerService } from "../../services/issuerService";
import { normalizeAddress, isValidSuiAddressStrict } from "../../utils/address";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function IssueCertificate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    candidateId: "",
    type: "Employment Verification",
    level: "Level I",
    expiresAt: "",
    internalRef: "",
  });
  const [issued, setIssued] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalized = normalizeAddress(form.candidateId);
    setForm((prev) => ({ ...prev, candidateId: normalized }));
    if (!isValidSuiAddressStrict(normalized)) {
      setError("Invalid Slush/Sui address. Use 0x + 64 hex characters.");
      toast.error("Invalid Slush/Sui address. Use 0x + 64 hex characters.");
      return;
    }
    setError("");
    setLoading(true);
    const record = await issuerService.issueCertificate({
      candidateId: normalized,
      type: form.type,
      level: form.level,
      expiresAt: form.expiresAt || null,
      internalRef: form.internalRef,
    });
    setIssued(record);
    toast.success(`Issued ${record.recordId}`);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Issue</p>
        <h1 className="text-2xl font-bold text-slate-900">Manual issuance</h1>
      </div>
      <Card className="p-5">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
                  ? "Invalid Slush/Sui address. Use 0x + 64 hex characters."
                  : ""
              );
            }}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text");
              const normalized = normalizeAddress(text);
              setForm((prev) => ({ ...prev, candidateId: normalized }));
              setError(
                normalized && !isValidSuiAddressStrict(normalized)
                  ? "Invalid Slush/Sui address. Use 0x + 64 hex characters."
                  : ""
              );
            }}
            placeholder="0x..."
            suffix={isValidSuiAddressStrict(normalizeAddress(form.candidateId)) ? <Badge variant="success">Valid</Badge> : null}
            required
          />
          <Input label="Issue date" value={new Date().toLocaleDateString()} disabled />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option>Employment Verification</option>
            <option>Education Check</option>
            <option>Compliance</option>
          </Select>
          <Select
            label="Level"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          >
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
          {error && (
            <p className="md:col-span-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={loading} disabled={!isValidSuiAddressStrict(normalizeAddress(form.candidateId))}>
              Issue
            </Button>
          </div>
        </form>
      </Card>

      {issued && (
        <Card className="p-4 border-green-200 bg-green-50 text-green-800">
          <p className="text-sm font-semibold">Issued successfully</p>
          <p className="text-sm">Verification Record ID: {issued.recordId}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/issuer/issued/${issued.recordId}`)}>
              View verification record
            </Button>
            <Button variant="ghost" onClick={() => window.open(issued.proofUrl, "_blank")}>
              External proof link
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default IssueCertificate;
