import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WrestleMetrics | Davidson Wrestling Analytics",
  description:
    "Mat-side match logging and real-time analytics for Davidson Wrestling.",
  metadataBase: new URL("https://wrestlemetrics.local"),
  openGraph: {
    title: "WrestleMetrics",
    description:
      "Log matches faster and uncover actionable wrestling insights.",
    siteName: "WrestleMetrics",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="app-shell antialiased">{children}</body>
    </html>
  );
}
