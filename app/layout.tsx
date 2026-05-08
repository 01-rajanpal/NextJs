import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "User Details & Daily Uploads",
  description:
    "Next.js starter with MongoDB users and Cloudflare image uploads via FilePond.",
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
