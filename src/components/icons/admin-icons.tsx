import { Win7Icon } from "./index";

interface IconProps {
  className?: string;
}

/* Original Windows 7 icons (see Win7Icon). */
export const IconTaskManager = (p: IconProps) => <Win7Icon name="task-manager" {...p} />;
export const IconAdminShield = (p: IconProps) => <Win7Icon name="shield" {...p} />;
export const IconAuditLogs = (p: IconProps) => <Win7Icon name="event-viewer" {...p} />;
export const IconLock = (p: IconProps) => <Win7Icon name="lock" {...p} />;

/* Event Viewer levels. */
export const IconEventInfo = (p: IconProps) => <Win7Icon name="info" {...p} />;
export const IconEventWarning = (p: IconProps) => <Win7Icon name="warning" {...p} />;
export const IconEventSuccess = (p: IconProps) => <Win7Icon name="shield-ok" {...p} />;
export const IconEventError = (p: IconProps) => <Win7Icon name="error" {...p} />;

/** Icono oficial de Windows Media Player en Windows 7 (WMP 12) */
export function IconWindowsMediaPlayer({ className }: IconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/win7/wmp/wmp-icon.png"
      alt="Windows Media Player"
      className={className}
      draggable={false}
    />
  );
}

