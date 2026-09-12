import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SKYNET: BorderLand", description: "The sky is the game board." };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="en"><body>{children}</body></html>; }
