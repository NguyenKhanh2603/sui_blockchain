import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import CopyButton from "../../components/ui/CopyButton";
import { issuerService } from "../../services/issuerService";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import Skeleton from "../../components/ui/Skeleton";
import { useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useAuth } from "../../store/AuthContext";
import toast from "react-hot-toast";

function IssuerStatus() {
  const [status, setStatus] = useState(null);
  const { user } = useAuth();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (user?.walletAddress) {
        issuerService.getIssuerProfile(user.walletAddress).then(setStatus);
    }
  }, [user]);

  const handleRegister = async (type) => {
    try {
        const tx = issuerService.registerIssuerTransaction(type);
        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: (res) => {
                toast.success("Registration Transaction Sent!");
                setTimeout(() => window.location.reload(), 2000);
            },
            onError: (err) => {
                console.error(err);
                toast.error("Registration failed");
            }
        });
    } catch(e) {
        console.error(e);
        toast.error("Error building transaction");
    }
  };

  if (!status) {
    return <Skeleton className="h-36 w-full" />;
  }
  
  const isUnregistered = status.status === "Unregistered" || status.orgName === "Unregistered Organization";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Issuer</p>
        <h1 className="text-2xl font-bold text-slate-900">Status & identity</h1>
      </div>

      {isUnregistered && (
          <Card className="p-6 border-l-4 border-l-blue-500 bg-blue-50">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Join VerifyMe as an Issuer</h2>
              <p className="text-sm text-slate-700 mb-4">
                  You are currently viewing as an unregistered address. To start issuing credentials, please register on the blockchain.
              </p>
              <div className="flex gap-4">
                  <Button onClick={() => handleRegister("COOP")}>Register as Co-op (Level 1)</Button>
                  <Button variant="secondary" onClick={() => handleRegister("NON_COOP")}>Register as Non-coop (Level 2)</Button>
              </div>
          </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Organization</p>
            <p className="text-lg font-bold text-slate-900">{status.orgName}</p>
            <p className="text-sm text-slate-600">Issuer type: {status.issuerType}</p>
            <p className="text-sm text-slate-600">Environment: {status.environment}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={status.status === "ACTIVE" ? "success" : "warning"} className="flex items-center gap-2">
              {status.status === "ACTIVE" ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {status.status}
            </Badge>
            <Badge variant="info">
              {status.verificationLevel === 0
                ? "Not verified"
                : status.verificationLevel === 1
                ? "Verified"
                : "Legally verified"}
            </Badge>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Issuer ID</p>
            <p className="text-sm font-semibold">{formatAddress(status.issuerId)}</p>
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
            {status.dnsProof && (
              <div className="text-xs text-slate-600">
                <p className="font-semibold">DNS proof</p>
                <p>Record ID: {status.dnsProof.recordId}</p>
                <p>Hash reference: {status.dnsProof.domainHash}</p>
              </div>
            )}
            {status.legalProof && (
              <div className="text-xs text-slate-600">
                <p className="font-semibold">Legal proof record</p>
                <p>Record ID: {status.legalProof.recordId}</p>
                <p>Hash reference: {status.legalProof.legalDocHash}</p>
              </div>
            )}
            {!status.dnsProof && !status.legalProof && (
              <p className="text-xs text-slate-500">No verification proof yet.</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Registry entry</p>
            <p className="text-xs text-slate-600">Issuer type: {status.issuerType}</p>
            <p className="text-xs text-slate-600">Verification level: {status.verificationLevel}</p>
            <p className="text-xs text-slate-600">Status: {status.status}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" onClick={() => window.location.href = "/issuer/verification"}>
            Complete verification
          </Button>
          {status.issuerType === "COOP" && status.verificationLevel >= 1 && (
            <Button variant="secondary" onClick={() => window.location.href = "/issuer/issue"}>
              Issue credential
            </Button>
          )}
          {status.issuerType === "NON_COOP" && (
            <Badge variant="warning">Issuing requires external verification</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}

export default IssuerStatus;
