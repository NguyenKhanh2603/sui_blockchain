import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { issuerService } from "../../services/issuerService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatDate } from "../../utils/formatters";
import { maskAddress } from "../../utils/address";
import Skeleton from "../../components/ui/Skeleton";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";

const statusVariant = (status) => {
  const key = (status || "").toUpperCase();
  if (key === "ISSUED" || key === "VERIFIED") return "success";
  if (key === "REVOKED" || key === "REJECTED") return "danger";
  return "warning";
};

function IssuedDetail() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [profile, setProfile] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    issuerService.getIssuerProfile().then(setProfile);
    issuerService.getCredentialDetail(recordId).then(setRecord);
  }, [recordId]);

  const revoke = async () => {
    await issuerService.revokeCredential(recordId);
    toast.success("Revoked");
    const updated = await issuerService.getCredentialDetail(recordId);
    setRecord(updated);
    setConfirmOpen(false);
  };

  if (!record) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Record</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {record.type} · {record.level}
          </h1>
        </div>
        <Badge variant={statusVariant(record.status)}>{(record.status || "").toUpperCase()}</Badge>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Record ID</p>
            <p className="font-semibold">{record.recordId}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Issued</p>
            <p className="font-semibold">{formatDate(record.issuedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Expires</p>
            <p className="font-semibold">{record.expiresAt ? formatDate(record.expiresAt) : "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Issuer</p>
            <p className="font-semibold">{record.issuerName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p className="font-semibold">{(record.status || "").toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Recipient type</p>
            <p className="font-semibold">
              {record.recipientType === "CCCD_HASH" ? "CCCD hash reference" : "Candidate ID"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Recipient</p>
            {record.recipientType === "CCCD_HASH" ? (
              <>
                <p className="text-sm text-slate-700">Hash reference: {record.cccdHashRef}</p>
                <p className="text-xs text-slate-500">Masked: {record.cccdMasked}</p>
              </>
            ) : (
              <p className="text-sm text-slate-700">{maskAddress(record.ownerCandidateId || record.candidateId)}</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Verification proof</p>
            <p className="text-sm text-slate-700">Data hash reference: {record.dataHash}</p>
            {profile?.dnsProof && (
              <p className="text-xs text-slate-600">DNS record: {profile.dnsProof.recordId}</p>
            )}
            {profile?.legalProof && (
              <p className="text-xs text-slate-600">Legal proof: {profile.legalProof.recordId}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-700">Verification history</p>
          <div className="mt-2 space-y-2 text-sm">
            {record.events && record.events.length ? (
              record.events.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="font-semibold">{e.action}</p>
                    <p className="text-xs text-slate-500">
                      Method: {e.method} · Result: {e.result}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(e.timestamp)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No events yet.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          {record.status !== "REVOKED" && (
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Revoke
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate("/issuer/issued")}>
            Back to list
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Revoke record"
        description="Confirm revocation and log to verification history."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revoke}>
              Revoke
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Reason: Fraud/Data correction/Expired/Other</p>
      </Modal>
    </div>
  );
}

export default IssuedDetail;
