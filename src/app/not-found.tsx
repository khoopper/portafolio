import type { Metadata } from "next";
import { NotFoundDialog } from "@/components/win7/NotFoundDialog";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false, follow: false } };

export default function NotFound() {
  return <NotFoundDialog />;
}
