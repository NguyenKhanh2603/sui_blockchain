import React from "react";
import { Toaster } from "react-hot-toast";

function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft",
          success: { iconTheme: { primary: "#345adf", secondary: "#fff" } },
        }}
      />
    </>
  );
}

export default ToastProvider;
