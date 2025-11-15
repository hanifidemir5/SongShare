"use client";

import { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string; // optional custom width
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-md",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        className={`relative bg-[#111827] p-6 rounded-lg shadow-lg w-full ${width}`}
      >
        {/* Title */}
        {title && (
          <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
        )}

        {/* Content */}
        {children}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✖
        </button>
      </div>
    </div>
  );
}
