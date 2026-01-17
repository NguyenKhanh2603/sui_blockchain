import React from "react";
import clsx from "clsx";

const Input = React.forwardRef(function Input(
  { label, helper, error, className, suffix, prefix, ...props },
  ref
) {
  return (
    <label className="block space-y-2">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <div
        className={clsx(
          "flex items-center rounded-lg border bg-white transition shadow-sm",
          error ? "border-red-400 ring-1 ring-red-100" : "border-slate-200",
          className
        )}
      >
        {prefix && <span className="pl-3 text-slate-500">{prefix}</span>}
        <input
          ref={ref}
          className="w-full rounded-lg border-none bg-transparent px-3 py-2.5 text-sm text-slate-900 focus:ring-0 placeholder:text-slate-400"
          {...props}
        />
        {suffix && <span className="pr-3 text-slate-500">{suffix}</span>}
      </div>
      {(helper || error) && (
        <p className={clsx("text-xs", error ? "text-red-500" : "text-slate-500")}>
          {error || helper}
        </p>
      )}
    </label>
  );
});

export default Input;
