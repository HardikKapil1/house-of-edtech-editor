// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import AuthProvider from "@/components/providers/session-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "House of EdTech Editor",
  description:
  "A local-first collaborative document editor with AI, offline support and real-time collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
return (
    <html lang="en">
      <body>
  <AuthProvider>
    <Header />
    {children}
    <Footer />
    <Toaster richColors />
  </AuthProvider>
</body>
    </html>
  );

}
