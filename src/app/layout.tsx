// src/app/layout.tsx - Purpose: root layout and metadata
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Log Viewer",
  description: "Log Viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased bg-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
