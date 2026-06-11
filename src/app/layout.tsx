import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProcureGuard",
  description: "Enterprise procurement agent with Terminal 3 authorization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
