import React, { useEffect, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { candidateService } from "../../services/candidateService";
import Card from "../../components/ui/Card";
import Toggle from "../../components/ui/Toggle";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import { maskId } from "../../utils/formatters";

function CVBuilder() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [visibility, setVisibility] = useState({});

  useEffect(() => {
    const load = async () => {
      const creds = await candidateService.getCredentials(user.id);
      setCredentials(creds);
      const initial = {};
      creds.forEach((c) => {
        initial[c.recordId] = c.visibility === "public" && !c.sensitive;
      });
      setVisibility(initial);
    };
    load();
  }, [user.id]);

  const toggle = (recordId) => {
    setVisibility((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${user.id}`);
    toast.success("Profile link copied");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">CV Builder</p>
          <h1 className="text-2xl font-bold text-slate-900">Control your public profile</h1>
          <p className="text-sm text-slate-600">
            Toggle which credentials appear on the public link. Sensitive ones stay locked by default.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopy}>Copy Link</Button>
          <Button onClick={() => window.open(`/u/${user.id}`, "_blank")}>Preview</Button>
        </div>
      </div>

      <Card className="p-5 space-y-3">
        {credentials.map((cred) => (
          <div
            key={cred.recordId}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{cred.type}</p>
              <p className="text-xs text-slate-500">{maskId(cred.recordId)} • {cred.issuerName}</p>
            </div>
            <div className="flex items-center gap-3">
              {cred.sensitive && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Sensitive locked
                </span>
              )}
              <Toggle enabled={visibility[cred.recordId]} onChange={() => toggle(cred.recordId)} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default CVBuilder;
