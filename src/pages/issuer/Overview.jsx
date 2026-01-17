import React, { useEffect, useState } from "react";
import StatCard from "../../components/shared/StatCard";
import { issuerService } from "../../services/issuerService";
import { Inbox, FileCheck2, Activity, Ban, Clock } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import { timeAgo } from "../../utils/formatters";

function IssuerOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    issuerService.getOverview().then(setData);
  }, []);

  if (!data) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Issuer</p>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Review Requests</Button>
          <Button>Issue Certificate</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending requests" value={data.pending} icon={<Inbox />} />
        <StatCard label="Issued (30d)" value={data.issued} delta="+12% MoM" icon={<FileCheck2 />} />
        <StatCard label="Active" value={data.active} icon={<Activity />} />
        <StatCard label="Revoked" value={data.revoked} icon={<Ban />} />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Recent activity</p>
          <Button variant="ghost" size="sm" icon={<Clock className="h-4 w-4" />}>
            View audit
          </Button>
        </div>
        <div className="mt-3 space-y-3">
          {data.activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                <p className="text-xs text-slate-500">
                  {item.actor} · {item.targetId}
                </p>
              </div>
              <span className="text-xs text-slate-500">{timeAgo(item.time)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default IssuerOverview;
