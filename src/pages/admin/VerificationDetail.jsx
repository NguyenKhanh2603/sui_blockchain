import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Input from "../../components/ui/Input";
import { adminService } from "../../services/adminService";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

function VerificationDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [audit, setAudit] = useState([]);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    const detail = await adminService.getSubmissionDetail(submissionId);
    setSubmission(detail);
    const logs = await adminService.listAdminAuditLogs({ targetId: submissionId });
    setAudit(logs);
  };

  useEffect(() => {
    load();
  }, [submissionId]);

  if (!submission) {
    return <Card className="p-4 text-sm text-slate-600">Loading submission…</Card>;
  }

  const handleApprove = async () => {
    if (!window.confirm("Approve this submission?")) return;
    await adminService.approveSubmission(submissionId);
    toast.success("Approved");
    load();
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Enter a reason");
      return;
    }
    await adminService.rejectSubmission(submissionId, reason, note);
    toast.success("Rejected");
    load();
  };

  const handleNeedsUpdate = async () => {
    if (!note.trim()) {
      toast.error("Add a note");
      return;
    }
    await adminService.requestUpdate(submissionId, note);
    toast.success("Update requested");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Submission</p>
          <h1 className="text-2xl font-bold text-slate-900">{submissionId}</h1>
          <p className="text-sm text-slate-600">{submission.entityName} · {submission.roleType}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={submission.status === "APPROVED" ? "success" : submission.status === "REJECTED" ? "danger" : "warning"}>
            {submission.status}
          </Badge>
          <Button variant="secondary" onClick={() => navigate("/admin/verifications")}>
            Back to inbox
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-700">Files</p>
        <div className="space-y-2">
          {(submission.files || []).map((file) => (
            <div key={file.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span>{file.name}</span>
              <a className="text-navy-600 font-semibold text-xs" href={file.url || "#"} target="_blank" rel="noreferrer">
                View
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Submitted at: {formatDate(submission.submittedAt)}</p>
        {submission.notes && <p className="text-xs text-slate-600">Notes: {submission.notes}</p>}
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Actions</p>
        <div className="grid gap-3 md:grid-cols-3">
          <Button variant="primary" onClick={handleApprove}>
            Approve
          </Button>
          <Button variant="secondary" onClick={handleNeedsUpdate}>
            Needs update
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            Reject
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Reason (reject)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold text-slate-700 mb-2">Admin audit log</p>
        <Table
          columns={[
            { key: "timestamp", header: "Time", render: (r) => formatDate(r.timestamp || r.time || r.createdAt) },
            { key: "actor", header: "Actor" },
            { key: "action", header: "Action" },
            { key: "targetId", header: "Target" },
            { key: "result", header: "Result" },
          ]}
          data={audit}
          emptyLabel="No actions yet"
        />
      </Card>
    </div>
  );
}

export default VerificationDetail;
