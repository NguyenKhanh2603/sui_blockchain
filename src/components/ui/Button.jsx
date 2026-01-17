import React from "react";
import clsx from "clsx";

const variants = {
  primary:
    "bg-navy-600 text-white hover:bg-navy-700 focus:ring-navy-200 shadow-soft",
  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:border-navy-200 hover:text-navy-700",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
  destructive:
    "bg-red-500 text-white hover:bg-red-600 focus:ring-red-200 border border-red-500",
};

const sizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  icon,
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {icon && <span className="h-5 w-5">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
