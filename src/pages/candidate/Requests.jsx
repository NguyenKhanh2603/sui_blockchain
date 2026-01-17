import React, { useEffect, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { candidateService } from "../../services/candidateService";
import { accessService } from "../../services/accessService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import toast from "react-hot-toast";
import { timeAgo } from "../../utils/formatters";

function CandidateRequests() {
  const { user, login } = useAuth();
  const [requests, setRequests] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const load = async (withLoading = true) => {
      if (withLoading) setLoading(true);
      const [data, creds] = await Promise.all([
        candidateService.getAccessRequests(user.id),
        candidateService.getCredentials(user.id),
      ]);
      setRequests(data);
      setCredentials(creds);
      if (withLoading) setLoading(false);
    };
    load();
  }, [user.id]);

  const updateStatus = async (id, status) => {
    await accessService.updateStatus(id, status);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === "unlocked" ? "Access granted" : "Rejected");
  };

  const claimableCredentials = credentials.filter((cred) => cred.boundToIdentityRef);

  const handleClaim = async () => {
    if (claimableCredentials.length === 0) return;
    setClaiming(true);
    const result = await candidateService.linkIdentityDemoAndClaim(user.id);
    const updatedCreds = await candidateService.getCredentials(user.id);
    setCredentials(updatedCreds);
    if (result?.profile && login) {
      await login(
        user.role,
        {
          ...user,
          hasCCCD: result.profile.hasCCCD,
          cccdHashRef: result.profile.cccdHashRef,
        },
        { useDefaults: false }
      );
    }
    toast.success("Identity linked. Credentials claimed.");
    setClaiming(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Requests</p>
        <h1 className="text-2xl font-bold text-slate-900">Manage access</h1>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Claimable credentials</p>
            <h2 className="text-lg font-bold text-slate-900">Link identity to claim</h2>
          </div>
          <Button
            variant="secondary"
            loading={claiming}
            onClick={handleClaim}
            disabled={claimableCredentials.length === 0}
          >
            Link identity &amp; claim (demo)
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : claimableCredentials.length === 0 ? (
          <Card className="p-6 text-center text-slate-500 border-dashed">
            No claimable credentials yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {claimableCredentials.map((cred) => (
              <Card key={cred.recordId} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{cred.type}</p>
                  <p className="text-xs text-slate-500">
                    {cred.issuerName} • {cred.recordId}
                  </p>
                  <Badge variant="warning" className="mt-2">
                    Identity-bound
                  </Badge>
                </div>
                <div className="text-sm text-slate-600">
                  Awaiting link to your CCCD
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : requests.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 border-dashed">
          No access requests right now.
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {req.recruiterName} wants {req.credentialRecordId} for {req.duration}
                </p>
                <p className="text-xs text-slate-500">{timeAgo(req.requestedAt)}</p>
                <Badge variant={req.status === "pending" ? "warning" : req.status === "unlocked" ? "success" : "danger"} className="mt-2">
                  {req.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => updateStatus(req.id, "rejected")}>
                  Reject
                </Button>
                <Button onClick={() => updateStatus(req.id, "unlocked")}>Approve</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CandidateRequests;
