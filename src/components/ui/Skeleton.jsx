import React from "react";
import clsx from "clsx";

function Skeleton({ className }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-slate-200/80",
        className
      )}
    />
  );
}

export default Skeleton;
