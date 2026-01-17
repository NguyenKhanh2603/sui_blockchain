import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import { adminService } from "../../services/adminService";

function AdminAudit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminService.listAdminAuditLogs().then(setLogs);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Admin</p>
        <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
      </div>
      <Card className="p-4">
        <Table
          columns={[
            { key: "timestamp", header: "Time" },
            { key: "actor", header: "Actor" },
            { key: "action", header: "Action" },
            { key: "targetId", header: "Target" },
            { key: "result", header: "Result" },
          ]}
          data={logs}
          emptyLabel="No audit events"
        />
      </Card>
    </div>
  );
}

export default AdminAudit;
