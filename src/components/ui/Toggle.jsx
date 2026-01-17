import React from "react";
import clsx from "clsx";

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange?.(!enabled)}
      className={clsx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition",
        enabled ? "bg-navy-500" : "bg-slate-200"
      )}
    >
      <span
        className={clsx(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
          enabled ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}

export default Toggle;
