import type { Metadata } from "next";
import "./globals.css";

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
      <body className={`antialiased bg-gray-900`}>{children}</body>
    </html>
  );
}
