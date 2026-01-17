import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import { adminService } from "../../services/adminService";
import { formatDate } from "../../utils/formatters";

function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    adminService.listSubmissions().then(setSubmissions);
  }, []);

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = submissions.filter((s) => s.status === "REJECTED").length;

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
