import React from "react";
import { Copy, CheckCheck } from "lucide-react";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import clsx from "clsx";

function CopyButton({ value, size = "sm", className, disabled, title }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!value || disabled) return;
    copy(value);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-navy-200 hover:text-navy-700 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "md" && "text-sm",
        className
      )}
      disabled={disabled}
      title={title}
    >
      {copied ? (
        <>
          <CheckCheck className="h-4 w-4" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copy
        </>
      )}
    </button>
  );
}

export default CopyButton;
