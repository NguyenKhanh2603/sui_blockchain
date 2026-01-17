import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import { adminService } from "../../services/adminService";
import { issuerService } from "../../services/issuerService";
import { formatDate } from "../../utils/formatters";
import { shortAddress } from "../../utils/address";
import toast from "react-hot-toast";

function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [issuers, setIssuers] = useState([]);
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    adminService.listSubmissions().then(setSubmissions);
    issuerService.listIssuers().then(setIssuers);
  }, []);

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = submissions.filter((s) => s.status === "REJECTED").length;

  const handleVerifyIssuer = async (issuerId) => {
    const target = issuers.find((i) => i.id === issuerId);
    setVerifyingId(issuerId);
    try {
      const res = await issuerService.verifyIssuerAndRefund(issuerId);
      setIssuers((prev) =>
        prev.map((issuer) => (issuer.id === issuerId ? { ...issuer, verified: true } : issuer))
      );
      const issuerName = res?.issuer?.name || target?.name || "Issuer";
      const refundedCount = res?.refund?.refundedCount || 0;
      if (refundedCount > 0) {
        toast.success(`Deposit refunded for ${issuerName} submissions.`);
      } else {
        toast.success(`${issuerName} marked as verified.`);
      }
    } catch (err) {
      toast.error("Unable to verify issuer");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Admin</p>
          <h1 className="text-2xl font-bold text-slate-900">Verification overview</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending", value: pendingCount, color: "bg-amber-50 text-amber-700" },
          { label: "Approved", value: approvedCount, color: "bg-green-50 text-green-700" },
          { label: "Rejected", value: rejectedCount, color: "bg-red-50 text-red-700" },
        ].map((card) => (
          <Card key={card.label} className={`p-4 ${card.color}`}>
            <p className="text-xs font-semibold">{card.label}</p>
            <p className="text-3xl font-bold">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Issuer verification</p>
            <h2 className="text-lg font-bold text-slate-900">Mark issuers as verified</h2>
          </div>
        </div>
        <div className="space-y-2">
          {issuers.map((issuer) => (
            <div
              key={issuer.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{issuer.name}</p>
                <p className="text-xs text-slate-500 truncate">{shortAddress(issuer.id)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={issuer.verified ? "success" : "warning"}>
                  {issuer.verified ? "Verified" : "Pending"}
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={issuer.verified || verifyingId === issuer.id}
                  loading={verifyingId === issuer.id}
                  onClick={() => handleVerifyIssuer(issuer.id)}
                >
                  {issuer.verified ? "Verified" : "Mark as Verified"}
                </Button>
              </div>
            </div>
          ))}
          {!issuers.length && (
            <p className="text-sm text-slate-600">No issuers available.</p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Recent submissions</p>
            <h2 className="text-lg font-bold text-slate-900">Legal reviews</h2>
          </div>
        </div>
        <Table
          columns={[
            { key: "submissionId", header: "ID" },
            { key: "entityName", header: "Entity" },
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
            { key: "submittedAt", header: "Submitted", render: (r) => formatDate(r.submittedAt) },
          ]}
          data={submissions.slice(0, 5)}
          emptyLabel="No submissions"
        />
      </Card>
    </div>
  );
}

export default AdminDashboard;
