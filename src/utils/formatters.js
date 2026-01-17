export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function maskId(id = "") {
  if (!id) return "";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function statusVariant(status) {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("revoked") || normalized.includes("rejected")) return "danger";
  if (normalized.includes("pending") || normalized.includes("locked")) return "warning";
  if (normalized.includes("active") || normalized.includes("verified") || normalized.includes("valid")) return "success";
  return "default";
}
