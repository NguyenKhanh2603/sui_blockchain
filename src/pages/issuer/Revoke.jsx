import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import { issuerService } from "../../services/issuerService";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/formatters";

function RevokeCenter() {
  const [form, setForm] = useState({ recordId: "", reason: "Fraud", note: "" });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    issuerService.getRevocationHistory().then(setHistory);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await issuerService.revokeRecord(form.recordId, form.reason);
    toast.success("Record revoked");
    const refreshed = await issuerService.getRevocationHistory();
    setHistory(refreshed);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Revoke</p>
        <h1 className="text-2xl font-bold text-slate-900">Revocation center</h1>
      </div>
      <Card className="p-5">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            label="Record ID / Candidate ID"
            value={form.recordId}
            onChange={(e) => setForm({ ...form, recordId: e.target.value })}
            required
          />
          <Select
            label="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          >
            <option>Fraud</option>
            <option>Data correction</option>
            <option>Expired</option>
            <option>Other</option>
          </Select>
          <Input
            className="md:col-span-2"
            label="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" variant="destructive">Revoke</Button>
          </div>
        </form>
      </Card>

      <Table
        columns={[
          { key: "recordId", header: "Record ID" },
          { key: "reason", header: "Reason" },
          { key: "timestamp", header: "Timestamp", render: (r) => formatDate(r.timestamp) },
          { key: "performedBy", header: "Performed By" },
        ]}
        data={history}
        emptyLabel="No revocations yet"
      />
    </div>
  );
}

export default RevokeCenter;
