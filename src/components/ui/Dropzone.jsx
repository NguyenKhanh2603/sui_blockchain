import React from "react";
import clsx from "clsx";
import { UploadCloud } from "lucide-react";

function Dropzone({ onFiles, className, helper }) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    onFiles?.(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition",
        isDragging && "border-navy-400 bg-navy-50",
        className
      )}
    >
      <UploadCloud className="h-8 w-8 text-navy-500" />
      <div>
        <p className="font-semibold text-slate-900">Drag & drop compliance files</p>
        <p className="text-sm text-slate-500">{helper || "PDFs, CSVs, DOC up to 10MB (UI only)"}</p>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy-700 shadow-sm">
        Browse files
      </span>
    </div>
  );
}

export default Dropzone;
