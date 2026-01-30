import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Sistem za mali biznis",
  description: "Aplikacija za upravljanje proizvodima i narudžbenicama",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
