import React from "react";
import Card from "../ui/Card";

function StatCard({ label, value, delta, icon }) {
  return (
    <Card className="p-4 md:p-5 hover:shadow-soft transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {delta && (
            <p className="text-xs font-semibold text-green-600 mt-1">{delta}</p>
          )}
        </div>
        {icon && <div className="rounded-full bg-navy-50 p-3 text-navy-600">{icon}</div>}
      </div>
    </Card>
  );
}

export default StatCard;
