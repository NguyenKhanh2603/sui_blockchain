import React from "react";
import clsx from "clsx";

const variants = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-navy-100 text-navy-700",
  outline: "border border-slate-200 text-slate-700",
};

function Badge({ children, variant = "default", className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
