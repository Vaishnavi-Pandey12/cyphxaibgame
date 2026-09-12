import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Skynet Borderland",
  description: "Tactical telemetry and survival protocol command console for Skynet Borderland airspace operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${jetbrainsMono.variable} ${ibmPlexSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0e0e0e] text-[#e5e2e1] selection:bg-[#920703] selection:text-white font-sans overflow-x-hidden">
        <div className="fixed inset-0 crt-overlay pointer-events-none z-30" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
