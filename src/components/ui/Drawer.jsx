import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

function Drawer({ open, onClose, title, children, width = "max-w-xl" }) {
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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={`pointer-events-auto w-screen ${width} bg-white shadow-2xl`}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {title}
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Drawer;
