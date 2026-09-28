import Image from "next/image";
import { cn } from "@/lib/cn";

interface AvatarProps {
  src: string | null;
  name: string;
  size: number;
  className?: string;
  priority?: boolean;
}

export function Avatar({ src, name, size, className, priority }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`Foto de ${name}`}
        width={size}
        height={size}
        priority={priority}
        className={cn("rounded-md object-cover", className)}
      />
    );
  }
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      role="img"
      aria-label={`Iniciales de ${name}`}
      className={cn("avatar-tile", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
