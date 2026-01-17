import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { candidateService } from "../services/candidateService";
import { accessService } from "../services/accessService";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { ShieldCheck, Lock, ExternalLink } from "lucide-react";
import { formatDate } from "../utils/formatters";
import Skeleton from "../components/ui/Skeleton";
import toast from "react-hot-toast";
import { isValidSuiAddressStrict, maskAddress, normalizeAddress } from "../utils/address";
import { useAuth } from "../store/AuthContext";

function PublicProfile() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState("24h");
  const [requesting, setRequesting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const normalizedParam = normalizeAddress(candidateId);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const normalized = normalizedParam;
      if (!isValidSuiAddressStrict(normalized)) {
        setInvalid(true);
        setLoading(false);
        return;
      }
      const profile = await candidateService.getProfile(normalized);
      const creds = await candidateService.getCredentials(normalized);
      if (!profile) {
        setInvalid(true);
        setLoading(false);
        return;
      }
      setCandidate(profile);
      setCredentials(
        creds.filter((c) => c.visibility === "public" || c.category === "selfClaimed")
      );
      setLoading(false);
    };
    load();
  }, [candidateId, normalizedParam]);

  const submitRequest = async () => {
    if (!selected) return;
    setRequesting(true);
    await accessService.requestAccess({
      candidateId,
      credentialRecordId: selected.recordId,
      recruiterName: "Viewer",
      duration,
    });
    toast.success("Request sent");
    setRequesting(false);
    setSelected(null);
  };

  const goToRecruiterFlow = () => navigate("/recruiter/dashboard");

  if (invalid) {
    return (
      <div className="min-h-screen bg-[#f6f8ff] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">Invalid Candidate ID</p>
          <p className="text-sm text-slate-600">
            Use a Slush/Sui address with 0x followed by 64 hexadecimal characters.
          </p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  const displayName = user?.name || candidate?.name;

  return (
    <div className="min-h-screen bg-[#f6f8ff]">
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14 space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center text-xl font-bold">
              {displayName?.slice(0, 1) || "U"}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Public profile</p>
              <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
              <p className="text-sm text-slate-600">{candidate?.bio}</p>
              <p className="text-xs text-slate-500 mt-1">Candidate ID: {maskAddress(candidate?.id)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">
              <ShieldCheck className="h-4 w-4" />
              {candidate?.trustScore || 80}% verified
            </Badge>
            <Button variant="secondary" onClick={goToRecruiterFlow}>
              Open recruiter view
            </Button>
          </div>
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Public credentials</p>
              <h2 className="text-xl font-bold text-slate-900">Shared with this link</h2>
            </div>
            <Button variant="ghost" onClick={goToRecruiterFlow} className="hidden md:inline-flex">
              Request more access
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {credentials.map((cred) => {
                const locked = cred.visibility === "private" || cred.sensitive;
                return (
                  <Card key={cred.recordId} className="relative overflow-hidden p-4">
                    {locked && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
                    )}
                    <div className="relative space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">
                          {cred.type}
                        </p>
                        <Badge variant={cred.status === "revoked" ? "danger" : "success"}>
                          {cred.status}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{cred.level}</h3>
                      <p className="text-sm text-slate-600">
                        Issued by {cred.issuerName} on {formatDate(cred.issuedAt)}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<ExternalLink className="h-4 w-4" />}
                        >
                          View proof
                        </Button>
                        {locked && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </Badge>
                        )}
                      </div>
                      {locked && (
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-sm text-slate-600">
                            This credential is private.
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelected(cred)}
                          >
                            Request access
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Request access"
        description={`Ask to view ${selected?.type || "the credential"}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button loading={requesting} onClick={submitRequest}>
              Send request
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            helper="24h / 7d / custom"
          />
          <p className="text-sm text-slate-600">
            We'll notify the candidate to approve. You'll see status in your recruiter dashboard.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default PublicProfile;
