import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

function Modal({ open, onClose, title, description, children, footer }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-slate-600">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4">{children}</div>
                {footer && <div className="mt-6">{footer}</div>}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Modal;
