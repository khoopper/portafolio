"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Avatar } from "@/components/Avatar";
import { ArrowGlyph } from "@/components/icons";
import { openPrivacyCenter } from "@/lib/consent";
import { ENTERED_KEY, setDesktopEmpty } from "@/lib/session-flag";

const noSubscribe = () => () => {};
function hasEntered() {
  try {
    return localStorage.getItem(ENTERED_KEY) !== null;
  } catch {
    return false; // Storage unavailable: just show the login screen.
  }
}

interface LoginScreenProps {
  name: string;
  headline: string;
  avatar: string | null;
}

export function LoginScreen({ name, headline, avatar }: LoginScreenProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // null on the server: hidden until we know this visitor has not entered yet, so returning
  // visitors never see a flash of the login on their way to the desktop.
  const entered = useSyncExternalStore(noSubscribe, hasEntered, () => null);
  const show = entered === false;

  useEffect(() => {
    if (entered) router.replace("/escritorio");
    else router.prefetch("/escritorio");
  }, [entered, router]);

  useEffect(() => {
    if (show) buttonRef.current?.focus();
  }, [show]);

  const enter = useCallback(() => {
    try {
      localStorage.setItem(ENTERED_KEY, "1");
      setDesktopEmpty(false); // a fresh login greets with the welcome window again
    } catch {
      // Ignore: the visitor will simply see this screen again next time.
    }
    // replace: the login is never left in the history, so Back can't return to it.
    router.replace("/escritorio");
  }, [router]);

  // Enter also logs in, even after the arrow button lost focus.
  // The focused button already handles its own Enter via click.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!show || e.key !== "Enter" || e.repeat || e.target === buttonRef.current) return;
      enter();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enter, show]);

  return (
    <div className="login-screen">
      <div className="wallpaper" aria-hidden="true" />
      <main className="login-center" hidden={!show}>
        <div className="user-tile">
          <Avatar src={avatar} name={name} size={130} priority className="size-full" />
        </div>
        <h1 className="login-name">{name}</h1>
        <p className="login-sub">{headline}</p>
        <button ref={buttonRef} type="button" onClick={enter} className="login-go mt-3" aria-label="Entrar al portafolio">
          <ArrowGlyph />
        </button>
        <p className="login-hint">Haz clic en la flecha o presiona Enter</p>
      </main>
      <nav className="login-legal" aria-label="Información legal">
        <Link href="/legal/privacidad">Privacidad</Link>
        {" · "}
        <Link href="/legal/cookies">Cookies</Link>
        {" · "}
        <Link href="/legal/terminos">Términos</Link>
        {" · "}
        <button type="button" onClick={openPrivacyCenter}>
          Preferencias
        </button>
      </nav>
      <p className="login-brand">khoopper.com</p>
    </div>
  );
}
