"use client";

import type { MouseEvent, ReactNode } from "react";

export function Modal({
  title,
  subtitle,
  width = "480px",
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  width?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  function stopProp(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col gap-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        style={{ maxWidth: width }}
        onClick={stopProp}
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <div className="mt-2 flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
