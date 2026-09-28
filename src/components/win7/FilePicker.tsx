"use client";

import { useRef, useState } from "react";

interface FilePickerProps {
  name: string;
  accept: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  /** Extra classes for the wrapper (width in a flex row) and stacked layout for narrow cards. */
  className?: string;
  stacked?: boolean;
  /** Called with the chosen file (null when cleared). */
  onFile?: (file: File | null) => void;
}

/** Windows 7 file field: a read-only text box with the file name and an «Examinar…» button. */
export function FilePicker({ name, accept, label, required, disabled, className = "", stacked, onFile }: FilePickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  return (
    <div className={`win-filepicker ${stacked ? "win-filepicker--stack" : ""} ${className}`}>
      <input
        ref={input}
        name={name}
        type="file"
        accept={accept}
        required={required}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setFileName(file?.name ?? "");
          onFile?.(file);
        }}
      />
      <input type="text" readOnly value={fileName} placeholder="Ningún archivo seleccionado" aria-label={`${label}: archivo seleccionado`} className="win-textbox" />
      <button type="button" className="win-button" disabled={disabled} onClick={() => input.current?.click()}>
        Examinar…
      </button>
    </div>
  );
}
