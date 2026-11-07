import type { Metadata } from "next";
import QrScanner from "@/components/admin/QrScanner";

export const metadata: Metadata = {
  title: "Entry Scanner",
  description: "ZANTA NIGHT ticket QR validation.",
  robots: { index: false, follow: false },
};

export default function ScanPage() {
  return <QrScanner />;
}
