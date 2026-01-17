import React from "react";
import clsx from "clsx";

function Card({ children, className, hoverable = false, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        hoverable && "transition hover:-translate-y-0.5 hover:shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
