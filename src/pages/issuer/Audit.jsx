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
  const [filters, setFilters] = useState({ action: "", method: "", result: "" });

  useEffect(() => {
    issuerService.getAuditLogs().then(setLogs);
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = filters.action ? log.action === filters.action : true;
      const matchesMethod = filters.method ? (log.method || "").toLowerCase().includes(filters.method.toLowerCase()) : true;
      const matchesResult = filters.result ? (log.result || "").toLowerCase().includes(filters.result.toLowerCase()) : true;
      return matchesAction && matchesMethod && matchesResult;
    });
  }, [logs, filters]);

  const exportCsv = () => {
    const header = ["time", "action", "method", "result", "targetId"];
    const rows = filtered.map((l) => [l.time, l.action, l.method, l.result, l.targetId]);
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
          <h1 className="text-2xl font-bold text-slate-900">Verification history</h1>
        </div>
        <Button onClick={exportCsv}>Export CSV</Button>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <Select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
          <option value="">All actions</option>
          <option value="ISSUED">ISSUED</option>
          <option value="EXTERNAL_VERIFY">EXTERNAL_VERIFY</option>
          <option value="REVOKED">REVOKED</option>
          <option value="LEGAL_REVIEW">LEGAL_REVIEW</option>
          <option value="DNS_CHECK">DNS_CHECK</option>
        </Select>
        <Input
          placeholder="Filter by method"
          value={filters.method}
          onChange={(e) => setFilters({ ...filters, method: e.target.value })}
        />
        <Input
          placeholder="Filter by result"
          value={filters.result}
          onChange={(e) => setFilters({ ...filters, result: e.target.value })}
        />
      </Card>

      <Table
        columns={[
          { key: "time", header: "Time", render: (r) => formatDate(r.time) },
          { key: "action", header: "Action" },
          { key: "method", header: "Method" },
          { key: "result", header: "Result" },
          { key: "targetId", header: "Record ID" },
        ]}
        data={filtered}
        emptyLabel="No logs"
      />
    </div>
  );
}

export default Audit;
