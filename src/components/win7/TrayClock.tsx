"use client";

import { useSyncExternalStore } from "react";

const formatter = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 10_000);
  return () => clearInterval(id);
}

export function TrayClock() {
  // Server snapshot is null → no hydration mismatch; the client fills it in.
  const time = useSyncExternalStore(subscribe, () => formatter.format(new Date()), () => null);
  return <span className="tray-clock">{time ?? "--:--"}</span>;
}
