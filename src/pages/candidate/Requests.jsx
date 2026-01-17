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
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await candidateService.getAccessRequests(user.id);
      setRequests(data);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const updateStatus = async (id, status) => {
    await accessService.updateStatus(id, status);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === "unlocked" ? "Access granted" : "Rejected");
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Requests</p>
        <h1 className="text-2xl font-bold text-slate-900">Manage access</h1>
      </div>

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
