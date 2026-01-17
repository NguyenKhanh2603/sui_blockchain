import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../store/AuthContext";
import { candidateService } from "../../services/candidateService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import Modal from "../../components/ui/Modal";
import { formatDate } from "../../utils/formatters";
import { maskAddress } from "../../utils/address";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Lock, Eye, Upload, ShieldCheck, Clock3 } from "lucide-react";
import CopyButton from "../../components/ui/CopyButton";

function Vault() {
  const { user } = useAuth();
  const account = useCurrentAccount();
  const connectedAddress = account?.address || "";
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const creds = await candidateService.getCredentials(user.id);
      setCredentials(creds);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const filtered = useMemo(() => {
    let data = [...credentials];
    if (filter === "verified") data = data.filter((c) => c.category === "verified");
    if (filter === "self") data = data.filter((c) => c.category === "selfClaimed");
    data.sort((a, b) =>
      sort === "newest"
        ? new Date(b.issuedAt) - new Date(a.issuedAt)
        : new Date(a.issuedAt) - new Date(b.issuedAt)
    );
    return data;
  }, [credentials, filter, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">My Vault</p>
          <h1 className="text-2xl font-bold text-slate-900">Credentials</h1>
          <p className="text-sm text-slate-600">Control visibility and share proofs when needed.</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton value={connectedAddress} />
          <Button variant="secondary" icon={<Upload className="h-4 w-4" />}>
            Import PDF (UI)
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All" },
          { key: "verified", label: "Verified" },
          { key: "self", label: "Self-Claimed" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === item.key ? "bg-navy-600 text-white" : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          Sort:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 border-dashed">
          No credentials yet.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((cred) => (
            <Card
              key={cred.recordId}
              className="relative overflow-hidden p-4 hover:shadow-soft transition cursor-pointer"
              onClick={() => setSelected(cred)}
            >
              {cred.visibility === "private" && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-80 backdrop-blur-sm" />
              )}
              <div className="relative flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Badge variant={cred.status === "active" ? "success" : cred.status === "revoked" ? "danger" : "warning"}>
                    {cred.status}
                  </Badge>
                  {cred.visibility === "private" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Private
                    </Badge>
                  )}
                </div>
                <div className="h-24 rounded-xl bg-gradient-to-br from-navy-50 to-white border border-slate-100" />
                <h3 className="text-lg font-bold text-slate-900">{cred.type}</h3>
                <p className="text-sm text-slate-600">Issuer: {cred.issuerName}</p>
                <p className="text-xs text-slate-500">Issued {formatDate(cred.issuedAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.type}
        description={`Record ${selected?.recordId}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary">Share proof</Button>
            <Button variant="primary" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 rounded-xl bg-navy-50 px-3 py-2 text-navy-700">
              <ShieldCheck className="h-4 w-4" /> Verified by {selected.issuerName} ({maskAddress(selected.issuerId)})
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-semibold capitalize">{selected.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Visibility</p>
                <p className="font-semibold capitalize">{selected.visibility}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Issued</p>
                <p className="font-semibold">{formatDate(selected.issuedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Expires</p>
                <p className="font-semibold">{selected.expiresAt ? formatDate(selected.expiresAt) : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Proof link</p>
                <a className="text-navy-600 font-semibold" href={selected.proofUrl} target="_blank" rel="noreferrer">
                  View proof
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500">History</p>
                <p className="font-semibold flex items-center gap-1">
                  <Clock3 className="h-4 w-4" /> Granted access to recruiter X · 3d ago
                </p>
              </div>
            </div>
            {selected.sensitive && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-700">
                <Eye className="h-4 w-4" /> Sensitive — keep locked by default
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Vault;
