import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import CopyButton from "../../components/ui/CopyButton";
import { issuerService } from "../../services/issuerService";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import Skeleton from "../../components/ui/Skeleton";
import { maskAddress } from "../../utils/address";

function IssuerStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    issuerService.getIssuerProfile().then(setStatus);
  }, []);

  if (!status) {
    return <Skeleton className="h-36 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Issuer</p>
        <h1 className="text-2xl font-bold text-slate-900">Status & identity</h1>
      </div>
      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Organization</p>
            <p className="text-lg font-bold text-slate-900">{status.orgName}</p>
            <p className="text-sm text-slate-600">Type: {status.issuer_type === "COOP" ? "CO-OP (integrated)" : "Non CO-OP (platform-managed)"}</p>
            <p className="text-sm text-slate-600">Environment: {status.environment}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={status.status === "ACTIVE" ? "success" : "warning"} className="flex items-center gap-2">
              {status.status === "ACTIVE" ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {status.status}
            </Badge>
            <Badge variant="info">Verification level: {status.verification_level === 0 ? "None" : status.verification_level === 1 ? "Domain verified" : "Legally verified"}</Badge>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Issuer ID</p>
            <p className="text-sm font-semibold">{maskAddress(status.issuerId)}</p>
            <CopyButton value={status.issuerId} className="mt-2" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Website</p>
            <p className="text-sm font-semibold">{status.website}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Support</p>
            <p className="text-sm font-semibold">{status.supportEmail}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <p className="text-sm font-semibold text-slate-700">Verification proof</p>
            {status.dns_proof && (
              <div className="text-xs text-slate-600">
                <p className="font-semibold">DNS proof record</p>
                <p>Record: {status.dns_proof.recordId}</p>
                <p>Hash: {status.dns_proof.domainHash}</p>
              </div>
            )}
            {status.legal_proof && (
              <div className="text-xs text-slate-600">
                <p className="font-semibold">Legal proof record</p>
                <p>Record: {status.legal_proof.recordId}</p>
                <p>Hash: {status.legal_proof.legalDocHash}</p>
              </div>
            )}
            {!status.dns_proof && !status.legal_proof && (
              <p className="text-xs text-slate-500">No verification proof yet.</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Registry entry</p>
            <p className="text-xs text-slate-600">Issuer type: {status.issuer_type}</p>
            <p className="text-xs text-slate-600">Verification level: {status.verification_level}</p>
            <p className="text-xs text-slate-600">Status: {status.status}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {status.verification_level < 2 && (
            <Button variant="primary" onClick={() => window.location.href = "/issuer/verification"}>
              Complete verification
            </Button>
          )}
          {status.issuer_type === "COOP" && status.verification_level >= 1 && (
            <Button variant="secondary" onClick={() => window.location.href = "/issuer/issue"}>
              Issue credential
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default IssuerStatus;
