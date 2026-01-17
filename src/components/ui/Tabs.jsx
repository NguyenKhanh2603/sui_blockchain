import React from "react";
import clsx from "clsx";

function Tabs({ tabs = [], activeTab, onChange, variant = "pill" }) {
  return (
    <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            "flex-1 rounded-full px-4 py-2 transition",
            activeTab === tab.value
              ? "bg-white text-navy-700 shadow-sm"
              : "text-slate-500 hover:text-navy-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
