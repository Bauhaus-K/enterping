import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "../components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enterping",
  description: "Interactive Japanese culture typing game and learning platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
