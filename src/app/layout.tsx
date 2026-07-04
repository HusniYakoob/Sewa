import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "material-symbols/rounded.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Brand typeface from the Claude Design handoff.
const sans = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sewa — Trusted local services in Sri Lanka",
  description:
    "Book trusted, NIC-verified local service providers across Sri Lanka. Secure payment, every job protected.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
