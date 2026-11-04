import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym Planner",
  description: "Diet and workout plans for gym members",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15181b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
