import React, { useEffect, useState } from "react";
import Table from "../../components/ui/Table";
import Drawer from "../../components/ui/Drawer";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import { issuerService } from "../../services/issuerService";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

function IssuerRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectData, setRejectData] = useState({ reason: "Other", note: "" });

  useEffect(() => {
    issuerService.getRequests().then(setRequests);
  }, []);

  const columns = [
    { key: "requestId", header: "Request ID" },
    { key: "candidateId", header: "Candidate ID" },
    { key: "type", header: "Type" },
    { key: "level", header: "Level" },
    { key: "submittedAt", header: "Submitted", sortable: true, sortValue: (r) => new Date(r.submittedAt).getTime(), render: (r) => formatDate(r.submittedAt) },
    { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "danger"}>{r.status}</Badge> },
  ];

  const approve = async () => {
    if (!selected) return;
    const record = await issuerService.approveRequest(selected.requestId);
    toast.success(`Approved - new record ${record.recordId}`);
    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === selected.requestId ? { ...r, status: "approved" } : r
      )
    );
    setSelected({ ...selected, status: "approved", createdRecord: record.recordId });
  };

  const reject = async () => {
    if (!selected) return;
    setRejecting(true);
    await issuerService.rejectRequest(selected.requestId, rejectData.reason);
    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === selected.requestId ? { ...r, status: "rejected" } : r
      )
    );
    toast.error("Request rejected");
    setSelected({ ...selected, status: "rejected" });
    setRejecting(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Requests</p>
        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
      </div>
      <Table
        columns={columns}
        data={requests}
        emptyLabel="No requests yet"
        onRowClick={(row) => setSelected(row)}
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Request detail"
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Request ID</p>
                <p className="font-semibold">{selected.requestId}</p>
              </div>
              <Badge variant={selected.status === "pending" ? "warning" : selected.status === "approved" ? "success" : "danger"}>
                {selected.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Candidate</p>
                <p className="font-semibold">{selected.candidateId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Type</p>
                <p className="font-semibold">{selected.type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Level</p>
                <p className="font-semibold">{selected.level}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Submitted</p>
                <p className="font-semibold">{formatDate(selected.submittedAt)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Internal note</p>
              <p className="text-sm">Auto screening passed. Pending manual review.</p>
            </div>
            {selected.createdRecord && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">
                Created record ID: {selected.createdRecord}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => approve()} disabled={selected.status !== "pending"}>
                Approve
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => setRejecting(true)}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject request"
        description="Provide reason for audit trail."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reject}>Reject</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Select
            label="Reason"
            value={rejectData.reason}
            onChange={(e) => setRejectData({ ...rejectData, reason: e.target.value })}
          >
            <option>Fraud</option>
            <option>Data correction</option>
            <option>Expired</option>
            <option>Other</option>
          </Select>
          <Textarea
            label="Optional note"
            rows={3}
            value={rejectData.note}
            onChange={(e) => setRejectData({ ...rejectData, note: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}

export default IssuerRequests;
