import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Age Security | FHE-Powered Age Verification",
  description: "Privacy-preserving age verification using Fully Homomorphic Encryption",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script id="global-polyfill" strategy="beforeInteractive">
          {`if (typeof global === 'undefined') { window.global = window; }`}
        </Script>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

