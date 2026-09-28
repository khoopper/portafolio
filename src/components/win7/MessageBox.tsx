"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CloseGlyph, IconWarning, Win7Icon } from "@/components/icons";

interface MessageBoxOptions {
  title: string;
  message: ReactNode;
  icon?: "warning" | "info" | "error";
  /** null = a plain notice with a single button (cancelLabel). */
  confirmLabel?: string | null;
  cancelLabel?: string;
}

/**
 * Windows 7 message box in place of window.confirm(). Usage:
 *   const [confirm, messageBox] = useConfirm();
 *   if (await confirm({ title, message })) …;   // and render {messageBox}
 * Built on <dialog>: modal, top layer (never trapped by the Aero frame), Esc = Cancel.
 */
export function useConfirm() {
  const [request, setRequest] = useState<(MessageBoxOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: MessageBoxOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  const messageBox = request ? (
    <MessageBox
      {...request}
      onClose={(ok) => {
        request.resolve(ok);
        setRequest(null);
      }}
    />
  ) : null;

  return [confirm, messageBox] as const;
}

function MessageBox({
  title,
  message,
  icon = "warning",
  confirmLabel = "Sí",
  cancelLabel = "No",
  onClose,
}: MessageBoxOptions & { onClose: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const safeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog?.open) dialog?.showModal();
    // showModal focuses the first control (the X); Windows focuses the safe answer instead.
    safeRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      className="msgbox aero-frame"
      aria-labelledby={titleId}
      aria-describedby={textId}
      // Esc: the browser fires "cancel" → answer No.
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
    >
      <header className="aero-titlebar">
        <h2 id={titleId} className="aero-title pl-1 text-[13px]">
          {title}
        </h2>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={() => onClose(false)}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="msgbox-client">
        <div className="msgbox-body">
          {icon === "warning" ? <IconWarning className="size-8 shrink-0" /> : <Win7Icon name={icon} className="size-8 shrink-0" />}
          <p id={textId}>{message}</p>
        </div>
        <div className="msgbox-buttons">
          {/* Destructive question: the safe answer keeps the default focus, as in Windows. */}
          {confirmLabel !== null && (
            <button type="button" className="win-button min-w-[74px]" onClick={() => onClose(true)}>
              {confirmLabel}
            </button>
          )}
          <button type="button" className="win-button win-button--primary min-w-[74px]" onClick={() => onClose(false)} ref={safeRef}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
