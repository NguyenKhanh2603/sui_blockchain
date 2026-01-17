import React, { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Toggle from "../../components/ui/Toggle";
import Button from "../../components/ui/Button";
import { trustService } from "../../services/trustService";
import toast from "react-hot-toast";

function TrustPage() {
  const [form, setForm] = useState({
    orgName: "",
    logo: "",
    website: "",
    policy: "",
    supportContact: "",
    workingHours: "",
    sla: "",
    public: true,
  });

  useEffect(() => {
    trustService.getSettings().then(setForm);
  }, []);

  const handlePublish = async () => {
    await trustService.updateSettings(form);
    toast.success("Trust page updated");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Trust Page Settings</p>
        <Input label="Organization name" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
        <Input label="Logo URL" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
        <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <Textarea label="Policy" rows={3} value={form.policy} onChange={(e) => setForm({ ...form, policy: e.target.value })} />
        <Input label="Support contact" value={form.supportContact} onChange={(e) => setForm({ ...form, supportContact: e.target.value })} />
        <Input label="Working hours" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
        <Input label="SLA" value={form.sla} onChange={(e) => setForm({ ...form, sla: e.target.value })} />
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-sm font-semibold text-slate-700">Public page</span>
          <Toggle enabled={form.public} onChange={(v) => setForm({ ...form, public: v })} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handlePublish}>Publish</Button>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Live preview</p>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-navy-50 to-white p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
              {form.logo ? <img src={form.logo} alt="logo" className="h-10 w-10 object-contain" /> : <span className="font-bold text-navy-700">Logo</span>}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{form.orgName}</p>
              <p className="text-sm text-slate-600">{form.website}</p>
            </div>
          </div>
          <p className="text-sm text-slate-700">{form.policy}</p>
          <div className="rounded-xl bg-white/70 border border-slate-200 p-3 text-sm text-slate-700">
            <p>Support: {form.supportContact}</p>
            <p>Hours: {form.workingHours}</p>
            <p>SLA: {form.sla}</p>
          </div>
          <span className="text-xs font-semibold text-navy-700">
            {form.public ? "Public page enabled" : "Hidden from public"}
          </span>
        </div>
      </Card>
    </div>
  );
}

export default TrustPage;
