import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { candidateService } from "../../services/candidateService";
import { accessService } from "../../services/accessService";
import { Shield, Lock, ShieldCheck, Eye, KeyRound, AlertCircle } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Skeleton from "../../components/ui/Skeleton";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/formatters";
import { maskAddress } from "../../utils/address";

const durationOptions = ["24h", "7d", "custom"];

function CandidateProfile() {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("verified");
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [duration, setDuration] = useState("24h");
  const [accessMap, setAccessMap] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const profile = await candidateService.getProfile(candidateId);
      const creds = await candidateService.getCredentials(candidateId);
      const requests = await candidateService.getAccessRequests(candidateId);
      const map = {};
      requests.forEach((r) => {
        map[r.credentialRecordId] = r.status;
      });
      setAccessMap(map);
      setCandidate(profile);
      setCredentials(creds);
      setLoading(false);
    };
    load();
  }, [candidateId]);

  const filtered = useMemo(
    () => credentials.filter((c) => c.category === activeTab),
    [credentials, activeTab]
  );

  const isLocked = (cred) => cred.sensitive || cred.visibility === "private";

  const handleRequest = async () => {
    if (!requestModal) return;
    await accessService.requestAccess({
      candidateId,
      credentialRecordId: requestModal.recordId,
      recruiterName: "You",
      duration,
    });
    setAccessMap((prev) => ({ ...prev, [requestModal.recordId]: "pending" }));
    toast.success("Request sent");
    setRequestModal(null);
  };

  const unlockStatus = (cred) => accessMap[cred.recordId] || (isLocked(cred) ? "locked" : "unlocked");

  return (
    <div className="space-y-6">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card className="p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center text-xl font-bold">
                {candidate?.name?.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Candidate</p>
                <h1 className="text-xl font-bold text-slate-900">{candidate?.name}</h1>
                <p className="text-xs text-slate-500">ID: {maskAddress(candidate?.id)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">
                <ShieldCheck className="h-4 w-4" /> Trust {candidate?.trustScore || 0}%
              </Badge>
              <Button variant="secondary" size="sm">
                Save
              </Button>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{candidate?.bio}</p>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Tabs
          tabs={[
            { value: "verified", label: "Verified Credentials" },
            { value: "selfClaimed", label: "Self-Claimed" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <Badge variant="outline">Audit trail (stub)</Badge>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 border-dashed">
          No credentials in this category.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((cred) => {
            const locked = isLocked(cred);
            const accessStatus = unlockStatus(cred);
            return (
              <Card
                key={cred.recordId}
                className="relative overflow-hidden p-4 hover:shadow-soft transition cursor-pointer"
                onClick={() => setSelectedCredential(cred)}
              >
                {locked && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
                )}
                <div className="relative space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">{cred.type}</p>
                    <Badge variant={cred.status === "revoked" ? "danger" : cred.status === "pending" ? "warning" : "success"}>
                      {cred.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{cred.level}</h3>
                  <p className="text-sm text-slate-600">
                    Issued by {cred.issuerName} on {formatDate(cred.issuedAt)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="h-3 w-3" />
                    Verified by {cred.issuerName} ({maskAddress(cred.issuerId)})
                  </div>
                  {cred.category === "selfClaimed" && (
                    <Badge variant="warning">Unverified</Badge>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="secondary" size="sm" icon={<Eye className="h-4 w-4" />}>
                      View proof
                    </Button>
                    {locked && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> {accessStatus}
                      </Badge>
                    )}
                  </div>
                  {locked && (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Sensitive content</p>
                        <p className="text-xs text-slate-500">
                          Access status: {accessStatus}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<KeyRound className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRequestModal(cred);
                        }}
                        disabled={accessStatus === "pending"}
                      >
                        {accessStatus === "pending" ? "Pending approval" : "Request access"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(selectedCredential)}
        onClose={() => setSelectedCredential(null)}
        title="Verification details"
        description={selectedCredential?.type}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedCredential(null)}>
              Close
            </Button>
            <Button variant="secondary" onClick={() => setRequestModal(selectedCredential)}>
              Request access
            </Button>
          </div>
        }
      >
        {selectedCredential && (
          <div className="space-y-3 text-sm text-slate-700">
            {selectedCredential.status === "revoked" && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-red-700">
                <AlertCircle className="h-4 w-4" /> This record is revoked.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Issuer</p>
                <p className="font-semibold">{selectedCredential.issuerName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Issued</p>
                <p className="font-semibold">{formatDate(selectedCredential.issuedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-semibold capitalize">{selectedCredential.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Proof</p>
                <a className="text-navy-600 font-semibold" href={selectedCredential.proofUrl} target="_blank" rel="noreferrer">
                  View proof
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(requestModal)}
        onClose={() => setRequestModal(null)}
        title="Request access"
        description={`Ask to unlock ${requestModal?.type}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRequestModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleRequest}>Submit</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Choose how long you'd like access. The candidate can approve or deny.
          </p>
          <div className="flex gap-2">
            {durationOptions.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  duration === d ? "border-navy-400 bg-navy-50 text-navy-700" : "border-slate-200 text-slate-600"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {duration === "custom" && <Input label="Custom duration" placeholder="e.g. 3 days" />}
        </div>
      </Modal>
    </div>
  );
}

export default CandidateProfile;
