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

  useEffect(() => {
    issuerService.getIssuerProfile().then((p) => {
      setProfile(p);
      setDomain(p.domain || "");
      setLegalStatus(p.legalStatus || "");
    });
  }, []);

  const generateToken = async () => {
    const res = await issuerService.startDnsSetup(domain);
    setTokenInfo(res);
  };

  const checkVerification = async () => {
    setChecking(true);
    const updated = await issuerService.checkDns(domain);
    setProfile(updated);
    if (updated?.dnsError) {
      toast.error(updated.dnsError);
    } else if ((updated?.verificationLevel || 0) >= 1) {
      toast.success("Domain verified");
    }
    setChecking(false);
  };

  const submitLegal = async () => {
    const updated = await issuerService.submitLegalDocs();
    setProfile(updated);
    setLegalStatus(updated.legalStatus || "under_review");
  };

  const approveLegal = async () => {
    const updated = await issuerService.approveLegalDemo();
    setProfile(updated);
    setLegalStatus(updated.legalStatus || "approved");
  };

  const hasDomain = (profile?.verificationLevel || 0) >= 1;
  const hasLegal = (profile?.verificationLevel || 0) >= 2;
  const isCoop = profile?.issuerType === "CO-OP";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Issuer</p>
        <h1 className="text-2xl font-bold text-slate-900">Verification steps</h1>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Step 1 · Domain verification (DNS)</p>
            <p className="text-xs text-slate-500">Prove domain control with a TXT record.</p>
          </div>
          {hasDomain ? <Badge variant="success">Domain verified</Badge> : <Badge variant="warning">Pending</Badge>}
        </div>
        {!isCoop && (
          <p className="text-sm text-slate-600">
            DNS verification is required only for CO-OP issuers. Your issuer type: NON-CO-OP.
          </p>
        )}
        <Input
          label="Domain"
          placeholder="atlas.edu"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        {isCoop && (
          <>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={generateToken} disabled={!domain}>
                Generate TXT token
              </Button>
              <Button onClick={checkVerification} loading={checking} disabled={!domain}>
                Check verification
              </Button>
            </div>
            {tokenInfo && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-sm font-semibold text-slate-700">DNS instructions</p>
                <p className="text-xs text-slate-600">Add the TXT record below to verify domain control.</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Host:</span>
                  <CopyButton value={tokenInfo.host} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Value:</span>
                  <CopyButton value={tokenInfo.value} />
                </div>
              </div>
            )}
            {profile?.dnsProof && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-1 text-sm text-green-800">
                <p className="font-semibold">Verification proof</p>
                <p>Record ID: {profile.dnsProof.recordId}</p>
                <p>Hash reference: {profile.dnsProof.domainHash}</p>
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Step 2 · Legal verification</p>
            <p className="text-xs text-slate-500">Provide legal documents to complete verification.</p>
          </div>
          {hasLegal ? <Badge variant="success">Legally verified</Badge> : <Badge variant="warning">{legalStatus || "Pending domain first"}</Badge>}
        </div>
        {!hasDomain && <p className="text-sm text-slate-600">Complete domain verification to unlock legal verification.</p>}
        {hasDomain && (
          <>
            <Dropzone onFiles={() => {}} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={submitLegal}>
                Submit for review
              </Button>
              <Button onClick={approveLegal} variant="primary">
                Mark approved (demo)
              </Button>
            </div>
            {profile?.legalProof && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-1 text-sm text-green-800">
                <p className="font-semibold">Verification proof</p>
                <p>Record ID: {profile.legalProof.recordId}</p>
                <p>Hash reference: {profile.legalProof.legalDocHash}</p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default Verification;
