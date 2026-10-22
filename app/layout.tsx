import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { DisclosureBanner } from "@/components/shell/disclosure-banner";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { I18nProvider } from "@/features/i18n/provider";
import { getI18n } from "@/features/i18n/server";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PreSignal",
  description:
    "Probabilities and trade records from prediction markets, for Fed rate decisions and notable bets before news events.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, tag } = await getI18n();

  return (
    <html
      lang={tag}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4">
            <SiteHeader />
            <DisclosureBanner />
            {children}
            <SiteFooter />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
