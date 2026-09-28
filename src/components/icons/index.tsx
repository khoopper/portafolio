interface IconProps {
  className?: string;
}

/**
 * Original Windows 7 icons (PNG in /public/images/win7/icons). Always decorative: every use
 * sits next to a visible label, so they are hidden from assistive tech.
 */
export function Win7Icon({ name, className }: IconProps & { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/images/win7/icons/${name}.png`} alt="" aria-hidden="true" draggable={false} className={className} />;
}

export const IconComputer = (p: IconProps) => <Win7Icon name="computer" {...p} />;
export const IconFolder = (p: IconProps) => <Win7Icon name="folder" {...p} />;
export const IconControlPanel = (p: IconProps) => <Win7Icon name="control-panel" {...p} />;
export const IconUser = (p: IconProps) => <Win7Icon name="user" {...p} />;
export const IconMail = (p: IconProps) => <Win7Icon name="mail" {...p} />;
export const IconAdd = (p: IconProps) => <Win7Icon name="add" {...p} />;
export const IconSave = (p: IconProps) => <Win7Icon name="save" {...p} />;
export const IconInternet = (p: IconProps) => <Win7Icon name="internet" {...p} />;
export const IconDocument = (p: IconProps) => <Win7Icon name="document" {...p} />;
export const IconProperties = (p: IconProps) => <Win7Icon name="properties" {...p} />;
export const IconOk = (p: IconProps) => <Win7Icon name="ok" {...p} />;
export const IconCancel = (p: IconProps) => <Win7Icon name="cancel" {...p} />;
export const IconWarning = (p: IconProps) => <Win7Icon name="warning" {...p} />;

export function ArrowGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      {/* Win7 logon arrow: solid white with a soft drop shadow. */}
      <path d="M3 8h8V3.5l6.5 6.5-6.5 6.5V12H3z" fill="currentColor" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.45))" }} />
    </svg>
  );
}

/** The Explorer back button itself (Win7 original), not just a glyph. */
export const BackButtonImage = (p: IconProps) => <Win7Icon name="back" {...p} />;

const glyphShadow = { filter: "drop-shadow(0 0 1px rgba(0,0,0,.85))" };

export function MinGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" className={className} style={glyphShadow} aria-hidden="true">
      <rect x="1" y="6" width="8" height="2.5" fill="#fff" />
    </svg>
  );
}

export function MaxGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" className={className} style={glyphShadow} aria-hidden="true">
      <rect x="1.2" y="1.2" width="7.6" height="7.6" fill="none" stroke="#fff" strokeWidth="1.6" />
      <rect x="1.2" y="1.2" width="7.6" height="2.2" fill="#fff" />
    </svg>
  );
}

export function CloseGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 10 10" width="11" height="11" className={className} style={glyphShadow} aria-hidden="true">
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
