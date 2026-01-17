import React, { useEffect, useState } from "react";
import { Plus, Edit3, CheckCircle2 } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Skeleton from "../../components/ui/Skeleton";
import { recruiterService } from "../../services/recruiterService";
import { timeAgo } from "../../utils/formatters";
import toast from "react-hot-toast";

const initialForm = {
  id: null,
  title: "",
  keywordsInput: "",
  minTrust: "",
  status: "draft",
};

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const list = await recruiterService.listJobs();
    setJobs(list);
    const active = list.find((j) => j.status === "active");
    setActiveId(active?.id || null);
    setLoading(false);
  };

  const openNew = () => {
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (job) => {
    setForm({
      id: job.id,
      title: job.title || "",
      keywordsInput: (job.keywords || []).join(", "),
      minTrust: job.minTrust ?? "",
      status: job.status || "draft",
    });
    setModalOpen(true);
  };

  const parseKeywords = (text = "") =>
    text
      .split(/[,\\n]/)
      .map((t) => t.trim())
      .filter(Boolean);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.title.trim()) {
      toast.error("Job title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: form.id,
        title: form.title.trim(),
        keywords: parseKeywords(form.keywordsInput),
        minTrust: form.minTrust ? Number(form.minTrust) : 0,
        status: form.status || "draft",
      };
      const saved = await recruiterService.saveJob(payload);
      if (payload.status === "active") {
        await recruiterService.setActiveJob(saved.id);
      }
      await loadJobs();
      toast.success("Job saved");
      setModalOpen(false);
    } catch (err) {
      toast.error("Unable to save job");
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (jobId) => {
    setSaving(true);
    try {
      await recruiterService.setActiveJob(jobId);
      await loadJobs();
      toast.success("Active job updated");
    } catch (err) {
      toast.error("Unable to update job");
    } finally {
      setSaving(false);
    }
  };

  const activeJob = jobs.find((j) => j.id === activeId) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Recruiter</p>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-sm text-slate-600">Define roles to unlock better recommendations.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New job
        </Button>
      </div>

      {activeJob && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Active job</p>
              <h3 className="text-lg font-bold text-slate-900">{activeJob.title}</h3>
              <p className="text-xs text-slate-500">Updated {timeAgo(activeJob.updatedAt)}</p>
              {activeJob.minTrust ? (
                <p className="mt-1 text-xs font-semibold text-navy-700">
                  Min trust score {activeJob.minTrust}%
                </p>
              ) : null}
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
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-4 w-4" /> Active
            </Badge>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">All jobs</p>
            <p className="text-xs text-slate-500">Create or edit a role to drive recommendations.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : jobs.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {jobs.map((job) => (
              <Card key={job.id} className="p-4 border border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                      <Badge variant={job.status === "active" ? "success" : "outline"}>
                        {job.status === "active" ? "Active" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Updated {timeAgo(job.updatedAt)}</p>
                    {job.minTrust ? (
                      <p className="mt-1 text-xs font-semibold text-navy-700">
                        Min trust score {job.minTrust}%
                      </p>
                    ) : null}
                    {job.keywords?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {job.keywords.map((kw) => (
                          <span key={kw} className="rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="secondary" className="gap-1" onClick={() => openEdit(job)}>
                      <Edit3 className="h-4 w-4" /> Edit
                    </Button>
                    {job.status === "active" ? (
                      <Badge variant="success" className="justify-center">Active</Badge>
                    ) : (
                      <Button size="sm" onClick={() => handleSetActive(job.id)} disabled={saving}>
                        Set active
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No jobs yet. Create one to start recommendations.</p>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit job" : "Create job"}
        description="Define what you are hiring for to see better matches."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <Input
            label="Job title"
            placeholder="e.g. Senior Product Designer"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <Textarea
            label="Keywords / requirements"
            placeholder="Comma separated: design, figma, portfolio"
            value={form.keywordsInput}
            onChange={(e) => setForm((prev) => ({ ...prev, keywordsInput: e.target.value }))}
            helper="We use these tokens to match candidates."
          />
          <Input
            label="Min trust score (optional)"
            type="number"
            min="0"
            max="100"
            value={form.minTrust}
            onChange={(e) => setForm((prev) => ({ ...prev, minTrust: e.target.value }))}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Status</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={form.status === "draft"}
                  onChange={() => setForm((prev) => ({ ...prev, status: "draft" }))}
                />
                Draft
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={form.status === "active"}
                  onChange={() => setForm((prev) => ({ ...prev, status: "active" }))}
                />
                Active
              </label>
            </div>
            <p className="text-xs text-slate-500">Only one job can be active; setting one active will pause others.</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Jobs;
