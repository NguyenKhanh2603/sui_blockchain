import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Dropzone from "../../components/ui/Dropzone";
import { issuerService } from "../../services/issuerService";
import CopyButton from "../../components/ui/CopyButton";
import toast from "react-hot-toast";

function Verification() {
  const [domain, setDomain] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(false);
  const [legalStatus, setLegalStatus] = useState("");
  const [dnsError, setDnsError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    issuerService.getIssuerProfile().then((p) => {
      setProfile(p);
      setDomain(p.domain || "");
      setLegalStatus(p.legalStatus || "");
    });
  }, []);

  const generateToken = async () => {
    const res = await issuerService.startDnsSetup(domain);
    if (res?.error) {
      setDnsError(res.error);
      return;
    }
    setDnsError("");
    setTokenInfo(res);
  };

  const checkVerification = async () => {
    setChecking(true);
    const updated = await issuerService.checkDns(domain);
    setProfile(updated);
    setDnsError(updated?.dnsError || "");
    if (updated?.dnsError) {
      toast.error(updated.dnsError);
    } else if ((updated?.verificationLevel || 0) >= 1) {
      toast.success("Domain verified");
    }
    setChecking(false);
  };

  const submitLegal = async () => {
    const updated = await issuerService.submitLegalDocs(uploadedFiles);
    setProfile(updated);
    setLegalStatus(updated.legalStatus || "under_review");
    toast.success("Submitted for review");
  };

  const approveLegal = async () => {
    const updated = await issuerService.approveLegalDemo();
    setProfile(updated);
    setLegalStatus(updated.legalStatus || "approved");
    toast.success("Marked approved (demo)");
  };

  const hasDomain = (profile?.verificationLevel || 0) >= 1;
  const hasLegal = (profile?.verificationLevel || 0) >= 2;
  const isCoop = profile?.issuerType === "COOP";
  const canStartLegal = isCoop ? hasDomain : true;
  const proofRecords = profile?.proofs || [];
  const dnsProof = proofRecords.find((p) => p.method === "DNS") || profile?.dnsProof;
  const legalProof = proofRecords.find((p) => p.method === "LEGAL") || profile?.legalProof;

  const steps = [
    {
      key: "dns",
      label: "Domain (DNS TXT)",
      status: !isCoop ? "skipped" : hasDomain ? "completed" : "pending",
    },
    {
      key: "legal",
      label: "Legal documents",
      status: hasLegal ? "completed" : legalStatus || "pending",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Issuer</p>
        <h1 className="text-2xl font-bold text-slate-900">Verification steps</h1>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${step.status === "completed" ? "bg-green-100 text-green-700" : step.status === "skipped" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>
                {idx + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{step.label}</p>
                <p className="text-[11px] uppercase font-bold tracking-wide text-slate-500">{step.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isCoop ? (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Step 1 · Domain verification (DNS)</p>
              <p className="text-xs text-slate-500">Add the TXT record below to prove domain control.</p>
            </div>
            {hasDomain ? <Badge variant="success">Domain verified</Badge> : <Badge variant="warning">Pending</Badge>}
          </div>
          <Input
            label="Official domain"
            placeholder="atlas.edu"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            error={dnsError}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={generateToken} disabled={!domain}>
              Generate TXT token
            </Button>
            <Button onClick={checkVerification} loading={checking} disabled={!domain}>
              Verify domain
            </Button>
          </div>
          {tokenInfo && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-sm font-semibold text-slate-700">DNS instructions</p>
              <p className="text-xs text-slate-600">Host + value to add to your DNS:</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Host:</span>
                <code className="rounded bg-white px-2 py-1 text-xs text-slate-700 border">{tokenInfo.host}</code>
                <CopyButton value={tokenInfo.host} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Value:</span>
                <code className="rounded bg-white px-2 py-1 text-xs text-slate-700 border">{tokenInfo.value}</code>
                <CopyButton value={tokenInfo.value} />
              </div>
            </div>
          )}
          {dnsProof && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-1 text-sm text-green-800">
              <p className="font-semibold">DNS proof record</p>
              <p>Record ID: {dnsProof.recordId || dnsProof.proofId}</p>
              <p>Hash reference: {dnsProof.domainHash || dnsProof.proofHash}</p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-5 space-y-2">
          <p className="text-sm font-semibold text-slate-700">Domain verification</p>
          <p className="text-sm text-slate-600">Your issuer type is NON-COOP. DNS verification is skipped; proceed to legal review to request verification.</p>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Step 2 · Legal verification</p>
            <p className="text-xs text-slate-500">Upload legal documents (Walrus mock) for admin review.</p>
          </div>
          {hasLegal ? <Badge variant="success">Legally verified</Badge> : <Badge variant="warning">{legalStatus || "Pending"}</Badge>}
        </div>
        {!canStartLegal && <p className="text-sm text-slate-600">Complete domain verification to unlock legal verification.</p>}
        {canStartLegal && (
          <>
            <Dropzone onFiles={(files) => setUploadedFiles(files)} />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={submitLegal} disabled={uploadedFiles.length === 0 && legalStatus === "under_review"}>
                Submit for review
              </Button>
              <Button onClick={approveLegal} variant="primary">
                Mark approved (demo)
              </Button>
            </div>
            {legalProof && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-1 text-sm text-green-800">
                <p className="font-semibold">Legal proof</p>
                <p>Record ID: {legalProof.recordId || legalProof.proofId}</p>
                <p>Hash reference: {legalProof.legalDocHash || legalProof.proofHash}</p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default Verification;
