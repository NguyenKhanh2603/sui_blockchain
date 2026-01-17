import React, { useEffect, useState } from "react";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { issuerService } from "../../services/issuerService";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function IssuedList() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ status: "", type: "" });
  const [revokeId, setRevokeId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    const data = await issuerService.getIssuedRecords(filters);
    setRecords(data);
  };

  useEffect(() => {
    load();
  }, [filters]);

  const columns = [
    { key: "recordId", header: "Record ID" },
    { key: "candidateId", header: "Candidate ID" },
    { key: "type", header: "Type" },
    { key: "level", header: "Level" },
    { key: "issuedAt", header: "Issued", render: (r) => formatDate(r.issuedAt) },
    { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "active" ? "success" : r.status === "revoked" ? "danger" : "warning"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/issuer/issued/${r.recordId}`)}>View</Button>
          {r.status === "active" && (
            <Button size="sm" variant="destructive" onClick={() => setRevokeId(r.recordId)}>Revoke</Button>
          )}
        </div>
      ),
    },
  ];

  const handleRevoke = async () => {
    if (!revokeId) return;
    await issuerService.revokeRecord(revokeId);
    toast.success("Revoked");
    setRevokeId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Issued</p>
          <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </Select>
          <Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All types</option>
            <option value="Employment Verification">Employment Verification</option>
            <option value="Education Check">Education Check</option>
            <option value="Compliance">Compliance</option>
          </Select>
        </div>
      </div>

      <Table columns={columns} data={records} emptyLabel="No issued records" />

      <Modal
        open={Boolean(revokeId)}
        onClose={() => setRevokeId(null)}
        title="Revoke record"
        description="Confirm revocation. This action marks the record as revoked."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRevokeId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke}>Revoke</Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Reason: Fraud/Data correction/Expired/Other</p>
      </Modal>
    </div>
  );
}

export default IssuedList;
