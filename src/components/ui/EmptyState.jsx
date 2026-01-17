import React from "react";
import Button from "./Button";

function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      {icon && <div className="text-slate-400">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        )}
      </div>
      {actionLabel && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
