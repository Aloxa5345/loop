import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "LOOP — AI Customer Feedback",
  description: "AI-powered customer feedback analysis platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <style>{`
          /* Hide footer on auth pages (login, signup, register) */
          body:has(.cs-root) footer,
          body:has(.su2-root) footer,
          body:has(.sp-root) footer,
          body:has(.gx-root) footer,
          body:has(.lm-root) footer,
          body:has(.lp-root) footer,
          body:has(.su-root) footer,
          body:has(.rp-root) footer,
          body:has(.rx-root) footer,
          body:has(.mg-root) footer,
          body:has(.rr-root) footer,
          body:has(.au-root) footer,
          body:has(.ll-root) footer,
          body:has(.nl-root) footer,
          body:has(.auth-page) footer { display: none !important; }
        `}</style>
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
