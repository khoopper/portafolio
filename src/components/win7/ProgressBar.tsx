export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped} className="win-progress">
      <div className="win-progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
