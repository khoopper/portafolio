import { TECH_ICONS } from "@/lib/tech-icons";

interface TechIconProps {
  slug: string | null;
  name: string;
  className?: string;
}

/** Decorative: always rendered next to the technology's visible name. */
export function TechIcon({ slug, name, className }: TechIconProps) {
  const icon = slug ? TECH_ICONS[slug] : undefined;
  if (!icon) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#3d7bd9" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Segoe UI, sans-serif">
          {name.slice(0, 2).toUpperCase()}
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}
