import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import { issuerService } from "../../services/issuerService";

function Team() {
  const [team, setTeam] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "Issuer Staff" });

  useEffect(() => {
    issuerService.getTeam().then(setTeam);
  }, []);

  const addMember = () => {
    setTeam((prev) => [
      ...prev,
      { id: `staff-${prev.length + 1}`, name: form.name, role: form.role, active: true },
    ]);
    setModalOpen(false);
  };

  const toggleActive = (id) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Team</p>
          <h1 className="text-2xl font-bold text-slate-900">Roles & access</h1>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add member</Button>
      </div>
      <Card className="p-4">
        <Table
          columns={[
            { key: "name", header: "Name" },
            { key: "role", header: "Role" },
            { key: "active", header: "Active", render: (r) => <Toggle enabled={r.active} onChange={() => toggleActive(r.id)} /> },
          ]}
          data={team}
          emptyLabel="No team members"
        />
      </Card>
      <Card className="p-4 border-dashed">
        <p className="text-sm font-semibold text-slate-700">Activity per staff (stub)</p>
        <p className="text-xs text-slate-500">Track actions by staff for auditing.</p>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add staff member"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={addMember}>Add</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>Admin</option>
            <option>Issuer Staff</option>
            <option>Auditor</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}

export default Team;
