import React from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { useAuth } from "../../store/AuthContext";
import toast from "react-hot-toast";

function CandidateSettings() {
  const { switchRole } = useAuth();
  const [role, setRole] = React.useState("candidate");

  const handleSwitch = async () => {
    await switchRole(role);
    toast.success(`Switched to ${role}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Settings</p>
        <h1 className="text-2xl font-bold text-slate-900">Preferences</h1>
      </div>
      <Card className="p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Privacy defaults</p>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-navy-600" />
            Lock sensitive credentials by default
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-slate-300 text-navy-600" />
            Notify me when recruiters request access
          </label>
        </div>
      </Card>
      <Card className="p-5 space-y-3 border-dashed">
        <p className="text-sm font-semibold text-slate-700">Role switcher (dev-only)</p>
        <div className="flex items-center gap-3">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
            <option value="issuer">Issuer</option>
          </Select>
          <Button onClick={handleSwitch}>Switch</Button>
        </div>
      </Card>
    </div>
  );
}

export default CandidateSettings;
