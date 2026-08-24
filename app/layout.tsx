import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex — Intelligent Learning",
  description: "Find the exact lessons you need across all your courses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
