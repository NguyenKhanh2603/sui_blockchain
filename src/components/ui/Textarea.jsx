import React from "react";
import clsx from "clsx";

const Textarea = React.forwardRef(function Textarea(
  { label, helper, error, className, ...props },
  ref
) {
  return (
    <label className="block space-y-2">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <textarea
        ref={ref}
        className={clsx(
          "w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-100",
          error ? "border-red-400" : "border-slate-200",
          className
        )}
        {...props}
      />
      {(helper || error) && (
        <p className={clsx("text-xs", error ? "text-red-500" : "text-slate-500")}>
          {error || helper}
        </p>
      )}
    </label>
  );
});

export default Textarea;
