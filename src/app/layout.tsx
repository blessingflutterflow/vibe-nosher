import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCoder - AI Coding Agent",
  description: "Terminal-style AI coding agent with web interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
