import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { useWallet } from "../../store/WalletContext";
import { candidateService } from "../../services/candidateService";
import { depositService } from "../../services/depositService";
import { storageService } from "../../services/storageService";
import { verificationService } from "../../services/verificationService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";
import { formatDate } from "../../utils/formatters";
import { maskAddress, shortAddress } from "../../utils/address";
import { Lock, Eye, Upload, ShieldCheck, Clock3 } from "lucide-react";
import CopyButton from "../../components/ui/CopyButton";
import Input from "../../components/ui/Input";
import Dropzone from "../../components/ui/Dropzone";
import toast from "react-hot-toast";
import { ConnectButton } from "@mysten/dapp-kit";

const defaultExternalForm = {
  issuerId: "0x3103103103103103103103103103103103103103103103103103103103103103",
  issuerName: "GrowthCert",
  issuerVerified: false,
  certId: "",
  file: null,
};

function Vault() {
  const { user } = useAuth();
  const {
    address: walletAddress,
    connected,
    connect,
    balance,
    adjustBalance,
    refreshBalance,
    connecting,
  } = useWallet();
  const connectedAddress = connected && walletAddress ? walletAddress : "";
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [adding, setAdding] = useState(false);
  const [externalForm, setExternalForm] = useState({ ...defaultExternalForm });
  const [submitting, setSubmitting] = useState(false);
  const [depositRecord, setDepositRecord] = useState(null);
  const [depositStatus, setDepositStatus] = useState("REQUIRED");
  const [idCheckStatus, setIdCheckStatus] = useState("NOT_RUN");
  const [storageRef, setStorageRef] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [depositPending, setDepositPending] = useState(false);
  const depositAmount = 5;
  const isNonCoIssuer = !externalForm.issuerVerified;

  const resetExternalFlow = () => {
    setExternalForm({ ...defaultExternalForm });
    setDepositRecord(null);
    setDepositStatus("REQUIRED");
    setIdCheckStatus("NOT_RUN");
    setStorageRef(null);
    setUploading(false);
    setDepositPending(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [creds, profileData] = await Promise.all([
        candidateService.getCredentials(user.id),
        candidateService.getCandidateProfile(user.id),
      ]);
      setCredentials(creds);
      setProfile(profileData);
      setLoading(false);
    };
    load();
  }, [user.id]);

  useEffect(() => {
    if (!adding) {
      resetExternalFlow();
    }
  }, [adding]);

  const claimable = credentials.filter(
    (cred) =>
      (!cred.ownerAddress || cred.recipientType === "CCCD_HASH") &&
      (cred.recipientType === "CCCD_HASH" || cred.cccdHashRef || cred.boundToIdentityRef)
  );

  const filtered = useMemo(() => {
    let data = [...credentials];
    if (filter === "verified") data = data.filter((c) => c.category === "verified");
    if (filter === "self") data = data.filter((c) => c.category === "selfClaimed");
    data.sort((a, b) =>
      sort === "newest"
        ? new Date(b.issuedAt) - new Date(a.issuedAt)
        : new Date(a.issuedAt) - new Date(b.issuedAt)
    );
    return data;
  }, [credentials, filter, sort]);

  const handleClaim = async (recordId) => {
    if (!connectedAddress) {
      toast.error("Connect wallet to claim");
      return;
    }
    const updated = await candidateService.claimCredential(recordId, connectedAddress);
    if (updated) {
      setCredentials((prev) => prev.map((c) => (c.recordId === recordId ? updated : c)));
      toast.success("Claimed to your wallet");
    }
  };

  const handlePayDeposit = async () => {
    if (!connectedAddress) {
      toast.error("Connect wallet to continue");
      return;
    }
    setDepositPending(true);
    try {
      const amountToUse = depositRecord?.amount ?? depositAmount;
      const required = depositRecord?.id
        ? depositRecord
        : await depositService.createRequiredDeposit({
            candidateAddress: connectedAddress,
            issuerId: externalForm.issuerId,
            credentialRecordId: null,
            amount: amountToUse,
          });
      await adjustBalance(-amountToUse);
      const paid = await depositService.payDeposit({
        depositId: required.id,
        candidateAddress: connectedAddress,
        issuerId: externalForm.issuerId,
        credentialRecordId: required.credentialRecordId,
        amount: amountToUse,
      });
      setDepositRecord(paid);
      setDepositStatus(paid.status || "PAID");
      toast.success("Deposit paid");
      await refreshBalance();
    } catch (err) {
      if (err?.message === "insufficient_balance") {
        toast.error("Insufficient balance");
      }
    } finally {
      setDepositPending(false);
    }
  };

  const runIdCheck = async () => {
    if (!isNonCoIssuer) return;
    if (!storageRef) {
      toast.error("Upload credential first");
      return;
    }
    setIdCheckStatus("CHECKING");
    try {
      const res = await verificationService.checkIdOnCert(storageRef.id);
      setIdCheckStatus(res.status);
      toast.success(res.status === "MATCHED" ? "ID matched on credential" : "ID check did not match");
    } catch (err) {
      setIdCheckStatus("NOT_RUN");
      toast.error("Unable to check ID");
    }
  };

  const handleFileUpload = async (files) => {
    const file = files?.[0] || null;
    setExternalForm((prev) => ({ ...prev, file }));
    if (!file) {
      setStorageRef(null);
      setIdCheckStatus("NOT_RUN");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await storageService.uploadFile(file);
      setStorageRef(uploaded);
      if (isNonCoIssuer) {
        setIdCheckStatus("CHECKING");
        const res = await verificationService.checkIdOnCert(uploaded.id);
        setIdCheckStatus(res.status);
        toast.success(res.status === "MATCHED" ? "ID matched on credential" : "ID check did not match");
      } else {
        setIdCheckStatus("NOT_RUN");
      }
    } catch (err) {
      setIdCheckStatus("NOT_RUN");
      toast.error("Unable to check ID");
    } finally {
      setUploading(false);
    }
  };

  const handleExternalSubmit = async () => {
    if (!connectedAddress) {
      toast.error("Connect wallet to continue");
      await connect?.();
      return;
    }
    if (!externalForm.certId) {
      toast.error("Certificate ID is required");
      return;
    }
    if (isNonCoIssuer && depositStatus !== "PAID") {
      toast.error("Pay deposit before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const newCred = await candidateService.addExternalCredential({
        candidateId: user.id,
        issuerId: externalForm.issuerId,
        issuerName: externalForm.issuerName,
        issuerVerified: externalForm.issuerVerified,
        certId: externalForm.certId,
        walrusFile: storageRef || (externalForm.file ? { fileName: externalForm.file.name } : null),
        walletAddress: connectedAddress,
        depositStatus: isNonCoIssuer ? depositStatus : "REFUNDED",
        depositId: depositRecord?.id || null,
        depositAmount: isNonCoIssuer ? depositAmount : 0,
        idCheckStatus,
        storageRef: storageRef?.id || null,
      });
      if (depositRecord?.id && newCred?.recordId) {
        await depositService.linkDepositToCredential(depositRecord.id, newCred.recordId);
      }
      setCredentials((prev) => [newCred, ...prev]);
      toast.success(isNonCoIssuer ? "Deposit locked for review" : "Credential added");
      setAdding(false);
      resetExternalFlow();
    } catch (err) {
      toast.error("Unable to add credential");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">My Vault</p>
          <h1 className="text-2xl font-bold text-slate-900">Credentials</h1>
          <p className="text-sm text-slate-600">Control visibility and share proofs when needed.</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton
            value={connectedAddress}
            disabled={!connectedAddress}
            title={!connectedAddress ? "Connect wallet to copy" : ""}
          />
          <Button
            variant="secondary"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => {
              resetExternalFlow();
              setAdding(true);
            }}
          >
            Import PDF (UI)
          </Button>
          <ConnectButton
            connectText="Connect wallet"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-navy-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All" },
          { key: "verified", label: "Verified" },
          { key: "self", label: "Self-Claimed" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === item.key ? "bg-navy-600 text-white" : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          Sort:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {claimable.length > 0 && (
        <Card className="p-4 space-y-3 border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700">Claimable credentials</p>
              <p className="text-sm font-semibold text-amber-800">Issued to your CCCD hash. Claim to wallet.</p>
            </div>
          </div>
          <div className="space-y-2">
            {claimable.map((cred) => (
              <div key={cred.recordId} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold">{cred.type}</p>
                  <p className="text-xs text-slate-500">{cred.recordId}</p>
                </div>
                <Button size="sm" onClick={() => handleClaim(cred.recordId)} disabled={!connectedAddress}>
                  Claim
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 border-dashed">
          No credentials yet.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((cred) => (
            <Card
              key={cred.recordId}
              className="relative overflow-hidden p-4 hover:shadow-soft transition cursor-pointer"
              onClick={() => setSelected(cred)}
            >
              {cred.visibility === "private" && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-80 backdrop-blur-sm" />
              )}
              <div className="relative flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={cred.status === "active" ? "success" : cred.status === "revoked" ? "danger" : "warning"}>
                      {cred.status}
                    </Badge>
                  </div>
                  {cred.visibility === "private" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Private
                    </Badge>
                  )}
                </div>
                <div className="h-24 rounded-xl bg-gradient-to-br from-navy-50 to-white border border-slate-100" />
                <h3 className="text-lg font-bold text-slate-900">{cred.type}</h3>
                <p className="text-sm text-slate-600">Issuer: {cred.issuerName}</p>
                <p className="text-xs text-slate-500">Issued {formatDate(cred.issuedAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.type}
        description={`Record ${selected?.recordId}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary">Share proof</Button>
            <Button variant="primary" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 rounded-xl bg-navy-50 px-3 py-2 text-navy-700">
              <ShieldCheck className="h-4 w-4" /> Verified by {selected.issuerName} ({maskAddress(selected.issuerId)})
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-semibold capitalize">{selected.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Visibility</p>
                <p className="font-semibold capitalize">{selected.visibility}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Issued</p>
                <p className="font-semibold">{formatDate(selected.issuedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Expires</p>
                <p className="font-semibold">{selected.expiresAt ? formatDate(selected.expiresAt) : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Proof link</p>
                <a className="text-navy-600 font-semibold" href={selected.proofUrl} target="_blank" rel="noreferrer">
                  View proof
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500">History</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock3 className="h-4 w-4" /> Granted access to recruiter X · 3d ago
                </p>
              </div>
            </div>
            {selected.sensitive && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-700">
                <Eye className="h-4 w-4" /> Sensitive — keep locked by default
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={adding}
        onClose={() => {
          setAdding(false);
          resetExternalFlow();
        }}
        title="Add external credential"
        description="Upload credential issued by an unverified issuer."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                resetExternalFlow();
              }}
            >
              Cancel
            </Button>
            <Button
              loading={submitting}
              onClick={handleExternalSubmit}
              disabled={uploading || idCheckStatus === "CHECKING" || (isNonCoIssuer && depositStatus !== "PAID")}
            >
              Submit for verification
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {isNonCoIssuer && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Deposit required to reduce spam and discourage fake submissions.
            </div>
          )}
          <Input
            label="Issuer"
            value={externalForm.issuerName}
            readOnly
          />
          <Input
            label="Certificate ID"
            value={externalForm.certId}
            onChange={(e) => setExternalForm({ ...externalForm, certId: e.target.value })}
            onBlur={(e) => setExternalForm({ ...externalForm, certId: e.target.value.trim() })}
            placeholder="Enter certificate ID"
            required
          />
          <Dropzone
            onFiles={handleFileUpload}
            helper="Upload credential PDF"
          />
          {isNonCoIssuer && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Deposit status</p>
                  <p className="text-sm font-semibold">{depositStatus}</p>
                  <p className="text-xs text-slate-500">Amount: {depositAmount.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs text-slate-500">
                    Balance: {balance != null ? balance.toFixed(2) : "--"}
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handlePayDeposit}
                    loading={depositPending}
                    disabled={depositStatus === "PAID"}
                  >
                    Pay deposit
                  </Button>
                </div>
              </div>
            </div>
          )}
          {isNonCoIssuer && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div>
                <p className="text-xs text-slate-500">Check ID on cert</p>
                <p className="text-sm font-semibold">{idCheckStatus}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={runIdCheck}
                disabled={idCheckStatus === "CHECKING" || !storageRef}
              >
                Re-run
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Vault;
