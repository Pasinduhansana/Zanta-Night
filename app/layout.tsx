import type { Metadata, Viewport } from "next";
import { Anton, Noto_Sans_Sinhala, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { EVENT } from "@/lib/event-config";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const sinhala = Noto_Sans_Sinhala({
  variable: "--font-sinhala",
  subsets: ["sinhala"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zantanight.example.com"),
  title: {
    default: `${EVENT.name} — ${EVENT.subtitle}`,
    template: `%s | ${EVENT.name}`,
  },
  description: `${EVENT.name}: ${EVENT.subtitle}. ${EVENT.date.shortLabel}, ${EVENT.time.label}. Featuring ${EVENT.performers
    .map((p) => p.name)
    .join(", ")}. Tickets — ${EVENT.ticket.priceLabel}.`,
  keywords: ["ZANTA NIGHT", "food festival", "DJ party", "Sri Lanka event", "ZANTA EVENTS"],
  openGraph: {
    title: `${EVENT.name} — ${EVENT.subtitle}`,
    description: `${EVENT.date.shortLabel} · ${EVENT.time.label} · ${EVENT.ticket.priceLabel} ${EVENT.ticket.category}`,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#001a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${grotesk.variable} ${sinhala.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col  bg-abyss text-bone">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
