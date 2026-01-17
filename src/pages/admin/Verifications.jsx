import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import Drawer from "../../components/ui/Drawer";
import { adminService } from "../../services/adminService";
import { issuerService } from "../../services/issuerService";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

function Verifications() {
  const [submissions, setSubmissions] = useState([]);
  const [filters, setFilters] = useState({ roleType: "ISSUER", status: "", search: "" });
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [issuerMeta, setIssuerMeta] = useState(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    const data = await adminService.listSubmissions(filters);
    const issuerProfile = await issuerService.getIssuerProfile();
    setIssuerMeta(issuerProfile);
    const enriched = data.map((s) =>
      s.roleType === "ISSUER"
        ? { ...s, issuerType: issuerProfile?.issuerType, verificationLevel: issuerProfile?.verificationLevel }
        : s
    );
    setSubmissions(enriched);
  };

  useEffect(() => {
    load();
  }, [filters.roleType, filters.status]);

  const handleSearch = async (e) => {
    e.preventDefault();
    load();
  };

  const openDetail = async (submissionId) => {
    const detail = await adminService.getSubmissionDetail(submissionId);
    setSelected(detail);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
    setReason("");
    setNote("");
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (!window.confirm("Approve this submission?")) return;
    const res = await adminService.approveSubmission(selected.submissionId);
    toast.success(res?.refunds ? `Approved · refunded ${res.refunds} deposit(s)` : "Approved");
    closeDrawer();
    load();
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!reason.trim()) {
      toast.error("Enter a reason");
      return;
    }
    await adminService.rejectSubmission(selected.submissionId, reason, note);
    toast.success("Rejected");
    closeDrawer();
    load();
  };

  const handleNeedsUpdate = async () => {
    if (!selected) return;
    if (!note.trim()) {
      toast.error("Add a note");
      return;
    }
    await adminService.requestUpdate(selected.submissionId, note);
    toast.success("Update requested");
    closeDrawer();
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-slate-500">Admin</p>
          <h1 className="text-2xl font-bold text-slate-900">Legal review hub</h1>
        </div>
        <form className="flex items-center gap-2" onSubmit={handleSearch}>
          <Input
            className="w-64"
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {["ISSUER", "RECRUITER"].map((role) => (
          <button
            key={role}
            onClick={() => setFilters((prev) => ({ ...prev, roleType: role }))}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filters.roleType === role ? "bg-navy-600 text-white" : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            {role === "ISSUER" ? "Issuer verifications" : "Recruiter verifications"}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold text-slate-500">Status</span>
          {["", "PENDING", "APPROVED", "REJECTED", "NEEDS_UPDATE"].map((status) => (
            <button
              key={status || "all-status"}
              onClick={() => setFilters((prev) => ({ ...prev, status }))}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                filters.status === status ? "bg-navy-600 text-white" : "bg-white border border-slate-200 text-slate-700"
              }`}
            >
              {status || "All"}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-4">
        <Table
          columns={[
            { key: "submissionId", header: "Submission ID" },
            { key: "entityName", header: "Entity" },
            { key: "issuerType", header: "Type", render: (r) => r.issuerType || "-" },
            { key: "verificationLevel", header: "Level", render: (r) => (r.verificationLevel ?? "-") },
            { key: "roleType", header: "Role" },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Badge variant={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "warning"}>
                  {r.status}
                </Badge>
              ),
            },
            { key: "submittedAt", header: "Submitted" },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <Button size="sm" variant="secondary" onClick={() => openDetail(r.submissionId)}>
                  Review
                </Button>
              ),
            },
          ]}
          data={submissions}
          emptyLabel="No submissions found"
        />
      </Card>

      <Drawer open={drawerOpen} onClose={closeDrawer} title="Review detail">
        {!selected ? (
          <p className="text-sm text-slate-600">No submission selected.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{selected.roleType}</p>
                <p className="text-lg font-bold text-slate-900">{selected.entityName}</p>
                <p className="text-sm text-slate-600">{selected.email}</p>
                <p className="text-xs text-slate-500">Submitted {formatDate(selected.submittedAt)}</p>
              </div>
              <Badge variant={selected.status === "APPROVED" ? "success" : selected.status === "REJECTED" ? "danger" : "warning"}>
                {selected.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Uploaded files</p>
              {(selected.files || []).map((file) => (
                <div key={file.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span>{file.name}</span>
                  <a className="text-navy-600 font-semibold text-xs" href={file.url || "#"} target="_blank" rel="noreferrer">
                    View
                  </a>
                </div>
              ))}
              {!selected.files?.length && <p className="text-xs text-slate-500">No files uploaded.</p>}
            </div>

            {selected.roleType === "ISSUER" && issuerMeta && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Existing proofs</p>
                {issuerMeta.dnsProof && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                    <p className="font-semibold">DNS proof</p>
                    <p>Record ID: {issuerMeta.dnsProof.recordId}</p>
                    <p>Hash: {issuerMeta.dnsProof.domainHash}</p>
                  </div>
                )}
                {issuerMeta.legalProof && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                    <p className="font-semibold">Legal proof</p>
                    <p>Record ID: {issuerMeta.legalProof.recordId}</p>
                    <p>Hash: {issuerMeta.legalProof.legalDocHash}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Actions</p>
              <div className="grid gap-2 md:grid-cols-3">
                <Button variant="primary" onClick={handleApprove}>
                  Approve legal
                </Button>
                <Button variant="secondary" onClick={handleNeedsUpdate}>
                  Needs update
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Reject
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input label="Reason (for rejection)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default Verifications;
