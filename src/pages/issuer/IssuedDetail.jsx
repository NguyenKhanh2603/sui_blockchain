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

function IssuedDetail() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);

  useEffect(() => {
    issuerService.getIssuedRecord(recordId).then(setRecord);
  }, [recordId]);

  const revoke = async () => {
    await issuerService.revokeRecord(recordId);
    toast.success("Revoked");
    const updated = await issuerService.getIssuedRecord(recordId);
    setRecord(updated);
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
        <Badge variant={record.status === "active" ? "success" : record.status === "revoked" ? "danger" : "warning"}>
          {record.status}
        </Badge>
      </div>

      <Card className="p-5 space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Candidate ID</p>
            <p className="font-semibold">{maskAddress(record.candidateId)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Issuer</p>
            <p className="font-semibold">{record.issuerName}</p>
          </div>
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
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">Status timeline</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>✓ Issued on {formatDate(record.issuedAt)}</li>
              <li>✓ Active verification record</li>
              {record.status === "revoked" && <li>⚠ Revoked — latest state</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">Proof panel</p>
            <div className="mt-2 space-y-2 text-sm">
              <a className="text-navy-600 font-semibold" href={record.proofUrl} target="_blank" rel="noreferrer">
                View verification record
              </a>
              <p className="text-slate-500">External proof link (placeholder)</p>
            </div>
          </div>
        </div>
        {record.status === "active" && (
          <div className="flex justify-end">
            <Button variant="destructive" onClick={revoke}>Revoke</Button>
          </div>
        )}
        <Button variant="secondary" onClick={() => navigate("/issuer/issued")}>Back to list</Button>
      </Card>
    </div>
  );
}

export default IssuedDetail;
