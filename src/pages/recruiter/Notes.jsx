import React from "react";
import Card from "../../components/ui/Card";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import { StickyNote } from "lucide-react";

function Notes() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500">Notes</p>
        <h1 className="text-2xl font-bold text-slate-900">Internal notes</h1>
      </div>
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-navy-50 p-2 text-navy-600">
            <StickyNote className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <Textarea rows={5} placeholder="Write private notes about candidates..." />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Notes stay internal. Candidate never sees this.</p>
              <Button variant="secondary">Save note</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Notes;
