import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Search, LayoutGrid, List, ShieldCheck, Sparkles, Filter } from "lucide-react";
import { recruiterService } from "../../services/recruiterService";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Skeleton from "../../components/ui/Skeleton";
import { timeAgo } from "../../utils/formatters";
import { isValidSuiAddressStrict, maskAddress, normalizeSlushAddress } from "../../utils/address";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recoLoading, setRecoLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("card");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const normalizeString = (str = "") => str.toLowerCase().trim();
  const tokenize = (str = "") =>
    normalizeString(str)
      .split(/\s+/)
      .filter(Boolean);
  const candidateMatchesTokens = (candidate = {}, tokens = []) => {
    if (!tokens.length) return true;
    const normalizedName = normalizeString(candidate.name);
    const normalizedUsername = normalizeString(candidate.username);
    return tokens.every((t) => normalizedName.includes(t) || normalizedUsername.includes(t));
  };

  const extractCandidateId = (value = "") => {
    const normalized = normalizeSlushAddress(value);
    return isValidSuiAddressStrict(normalized) ? normalized : null;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [data, job] = await Promise.all([
        recruiterService.getRecentCandidates(),
        recruiterService.getActiveJob(),
      ]);
      if (!mounted) return;
      setRecent(data);
      setActiveJob(job);
      setLoading(false);
      if (job) {
        setRecoLoading(true);
        recruiterService.recommendedCandidatesForJob(job).then((recs) => {
          if (!mounted) return;
          setRecommended(recs);
          setRecoLoading(false);
        });
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const candidateId = extractCandidateId(search);
    if (candidateId) {
      setSearch(candidateId);
      setError("");
      navigate(`/recruiter/candidate/${candidateId}`);
      return;
    }
    setError("");
  };

  const handleBlur = () => {
    const candidateId = extractCandidateId(search);
    if (candidateId) {
      setSearch(candidateId);
      setError("");
    } else {
      setError("");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const candidateId = extractCandidateId(text);
    if (candidateId) {
      setSearch(candidateId);
      setError("");
    } else {
      setSearch(text);
      setError("");
    }
  };

  const candidateIdFromInput = extractCandidateId(search);
  const isValidAddress = Boolean(candidateIdFromInput);

  const nameTokens = !candidateIdFromInput ? tokenize(search) : [];
  const filteredByStatus = statusFilter
    ? recent.filter((c) => c.status?.toLowerCase() === statusFilter)
    : recent;
  const filtered = filteredByStatus.filter((c) =>
    candidateMatchesTokens(c, nameTokens)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">Recruiter</p>
          <h1 className="text-2xl font-bold text-slate-900">Verification hub</h1>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
          <Sparkles className="h-4 w-4 text-navy-500" />
          Saved searches · Compare candidates
        </div>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Search by Candidate ID or username</label>
          <div className="relative flex items-center gap-2">
            <Search className="absolute left-3 h-5 w-5 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-base shadow-sm focus:border-navy-300 focus:outline-none"
              placeholder="Search by Candidate ID or username"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setError("");
              }}
              onBlur={handleBlur}
              onPaste={handlePaste}
            />
            {isValidAddress && (
              <CheckCircle2 className="absolute right-16 h-5 w-5 text-green-500" />
            )}
            <Button type="submit" className="shrink-0" disabled={!search.trim()}>
              Search
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Search by Candidate ID or username. IDs validate automatically; usernames filter the list.
          </p>
          {error && (
            <p className="text-xs font-semibold text-red-600">
              {error}
            </p>
          )}
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {["", "verified", "pending", "locked"].map((status) => (
            <button
              key={status || "all"}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === status
                  ? "bg-navy-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : "All"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("card")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              view === "card" ? "border-navy-300 text-navy-700" : "border-slate-200 text-slate-600"
            }`}
          >
            <LayoutGrid className="h-4 w-4 inline-block mr-1" /> Cards
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              view === "list" ? "border-navy-300 text-navy-700" : "border-slate-200 text-slate-600"
            }`}
          >
            <List className="h-4 w-4 inline-block mr-1" /> List
          </button>
        </div>
      </div>

      {activeJob && (
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Recommended candidates</p>
              <p className="text-xs text-slate-500">Based on active job: {activeJob.title}</p>
              {activeJob.keywords?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeJob.keywords.map((kw) => (
                    <span key={kw} className="rounded-full bg-navy-50 text-navy-700 px-2 py-1 text-[11px] font-semibold">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Badge variant="success">Active job</Badge>
          </div>
          {recoLoading ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : recommended.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {recommended.map((c) => (
                <Card key={c.id} className="p-3 hover:shadow-soft transition cursor-pointer" onClick={() => navigate(`/recruiter/candidate/${c.id}`)}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                      {c.username && <p className="text-xs font-semibold text-slate-600">@{c.username}</p>}
                      <p className="text-xs text-slate-500">{maskAddress(c.id)}</p>
                    </div>
                    <Badge variant="info">Matches {c.score}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-1 text-navy-700 font-semibold">
                      <ShieldCheck className="h-3 w-3" /> Trust {c.trustScore}%
                    </span>
                    <span className="text-slate-500">Viewed {timeAgo(c.lastAction)}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No recommended candidates yet.</p>
          )}
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : view === "card" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4 hover:shadow-soft transition cursor-pointer" onClick={() => navigate(`/recruiter/candidate/${c.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center font-bold">
                    {c.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">{c.name}</p>
                    {c.username && <p className="text-xs font-semibold text-slate-600">@{c.username}</p>}
                    <p className="text-xs text-slate-500">{maskAddress(c.id)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={c.status === "verified" ? "success" : c.status === "pending" ? "warning" : "default"}>
                    {c.status}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{c.bio}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-1 text-navy-700 font-semibold">
                  <ShieldCheck className="h-3 w-3" /> Trust {c.trustScore}%
                </span>
                <span>Viewed {timeAgo(c.lastAction)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Trust</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Recent</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    {c.username && <div className="text-xs font-semibold text-slate-600">@{c.username}</div>}
                    <div className="text-xs text-slate-500">{maskAddress(c.id)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === "verified" ? "success" : c.status === "pending" ? "warning" : "default"}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">Trust {c.trustScore}%</td>
                  <td className="px-4 py-3">{timeAgo(c.lastAction)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/recruiter/candidate/${c.id}`)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 border-dashed">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Saved searches</p>
              <p className="text-xs text-slate-500">Pin a pattern to re-run later (UI stub)</p>
            </div>
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
            role: design · trustScore &gt; 80 · verified credentials ≥ 2
          </div>
        </Card>
        <Card className="p-4 border-dashed">
          <p className="text-sm font-semibold text-slate-700">Compare candidates</p>
          <p className="text-xs text-slate-500">Bring two profiles side-by-side (UI stub)</p>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
