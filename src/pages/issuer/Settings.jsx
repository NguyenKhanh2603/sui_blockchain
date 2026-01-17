import React from "react";
import Card from "../../components/ui/Card";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { useAuth } from "../../store/AuthContext";
import toast from "react-hot-toast";

function IssuerSettings() {
  const { switchRole } = useAuth();
  const [role, setRole] = React.useState("issuer");

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
        <p className="text-sm font-semibold text-slate-700">Support</p>
        <p className="text-sm text-slate-600">Need help? Contact support@verifyme.test</p>
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

export default IssuerSettings;
