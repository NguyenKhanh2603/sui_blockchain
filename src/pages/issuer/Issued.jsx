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
import Input from "../../components/ui/Input";
import { maskAddress } from "../../utils/address";

const statusVariant = (status) => {
  const key = (status || "").toUpperCase();
  if (key === "ISSUED" || key === "VERIFIED") return "success";
  if (key === "REVOKED" || key === "REJECTED") return "danger";
  return "warning";
};

function IssuedList() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ status: "", recipientType: "", from: "", to: "" });
  const [revokeId, setRevokeId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    const data = await issuerService.listIssuedCredentials(filters);
    setRecords(data);
  };

  useEffect(() => {
    load();
  }, [filters]);

  const columns = [
    { key: "recordId", header: "Record ID" },
    { key: "type", header: "Credential type" },
    {
      key: "recipientType",
      header: "Recipient type",
      render: (r) => (r.recipientType === "CCCD_HASH" ? "CCCD hash ref" : "Candidate ID"),
    },
    {
      key: "recipientValue",
      header: "Recipient",
      render: (r) =>
        r.recipientType === "CCCD_HASH"
          ? r.cccdHashRef || "hash_ref"
          : maskAddress(r.ownerCandidateId || r.candidateId),
    },
    { key: "issuedAt", header: "Issued at", render: (r) => formatDate(r.issuedAt) },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{(r.status || "").toUpperCase()}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status !== "REVOKED" ? (
          <div className="flex justify-end">
            <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setRevokeId(r.recordId); }}>
              Revoke
            </Button>
          </div>
        ) : null,
    },
  ];

  const handleRevoke = async () => {
    if (!revokeId) return;
    await issuerService.revokeCredential(revokeId);
    toast.success("Record revoked");
    setRevokeId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Issued</p>
          <h1 className="text-2xl font-bold text-slate-900">Registry entries</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="ISSUED">Issued</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVOKED">Revoked</option>
          </Select>
          <Select
            value={filters.recipientType}
            onChange={(e) => setFilters({ ...filters, recipientType: e.target.value })}
          >
            <option value="">All recipients</option>
            <option value="CANDIDATE_ID">Candidate ID</option>
            <option value="CCCD_HASH">CCCD hash ref</option>
          </Select>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            label="From"
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            label="To"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={records}
        emptyLabel="No issued records"
        onRowClick={(row) => navigate(`/issuer/issued/${row.recordId}`)}
      />

      <Modal
        open={Boolean(revokeId)}
        onClose={() => setRevokeId(null)}
        title="Revoke record"
        description="Confirm revocation. This action marks the record as revoked and logs a verification event."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRevokeId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke}>
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

export default IssuedList;
