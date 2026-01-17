import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { issuerService } from "../../services/issuerService";
import { formatDate } from "../../utils/formatters";

function Audit() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: "", actor: "" });

  useEffect(() => {
    issuerService.getAuditLogs().then(setLogs);
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = filters.action ? log.action === filters.action : true;
      const matchesActor = filters.actor
        ? log.actor.toLowerCase().includes(filters.actor.toLowerCase())
        : true;
      return matchesAction && matchesActor;
    });
  }, [logs, filters]);

  const exportCsv = () => {
    const header = ["time", "actor", "action", "targetId"];
    const rows = filtered.map((l) => [l.time, l.actor, l.action, l.targetId]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Audit</p>
          <h1 className="text-2xl font-bold text-slate-900">Logs & Export</h1>
        </div>
        <Button onClick={exportCsv}>Export CSV</Button>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <Select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        >
          <option value="">All actions</option>
          <option>Approved request</option>
          <option>Issued certificate</option>
          <option>Access granted</option>
          <option>Exported CSV</option>
        </Select>
        <Input
          placeholder="Filter by actor"
          value={filters.actor}
          onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
        />
      </Card>

      <Table
        columns={[
          { key: "time", header: "Time", render: (r) => formatDate(r.time) },
          { key: "actor", header: "Actor" },
          { key: "action", header: "Action" },
          { key: "targetId", header: "Target record" },
        ]}
        data={filtered}
        emptyLabel="No logs"
      />
    </div>
  );
}

export default Audit;
