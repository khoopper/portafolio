import { IconOk, IconWarning } from "@/components/icons";

/** Windows 7 status line: original 16 px icon plus the message (role="status" so it is announced). */
export function InfoBar({ ok, children }: { ok: boolean; children: string }) {
  return (
    <p role="status" className={`win-infobar ${ok ? "" : "win-infobar--warn"}`}>
      {ok ? <IconOk className="size-4 shrink-0" /> : <IconWarning className="size-4 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}
