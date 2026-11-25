import Link from "next/link";
import type { ReactNode } from "react";
import { CaritoFooter, CaritoNav } from "./CaritoChrome";
import styles from "./carito.module.css";

export const LEGAL_UPDATED = "24 de noviembre de 2026";

/** A legal page of Carito Music: the product's nav, a readable column on white, the product's footer. */
export function CaritoLegal({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className={`${styles.root} min-h-screen`}>
      <CaritoNav base="/carito" />
      <main className="bg-white px-5 pb-24 pt-14 sm:pt-20">
        <div className={styles.legal}>
          <p className="text-[14px] text-[#6e6e73]">
            <Link href="/carito" className="text-[#6d28d9] hover:underline">Carito Music</Link> · Última actualización: {LEGAL_UPDATED}
          </p>
          <h1 className={`${styles.display} mt-3 text-[clamp(2.25rem,5vw,3rem)] text-[#1d1d1f]`}>{title}</h1>
          <p className="mt-5 !text-[21px] !leading-[1.45] !text-[#6e6e73]">{lead}</p>
          {children}
        </div>
      </main>
      <CaritoFooter />
    </div>
  );
}
