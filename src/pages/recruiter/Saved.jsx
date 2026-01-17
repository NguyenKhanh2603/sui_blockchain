import React from "react";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { Bookmark } from "lucide-react";

function Saved() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Saved</p>
        <h1 className="text-2xl font-bold text-slate-900">Pinned candidates</h1>
      </div>
      <Card className="p-4">
        <EmptyState
          title="No pinned candidates"
          description="Pin searches or profiles to monitor status changes quickly."
          icon={<Bookmark className="h-5 w-5" />}
          actionLabel="Pin first candidate"
        />
      </Card>
    </div>
  );
}

export default Saved;
