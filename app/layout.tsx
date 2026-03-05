import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git & GitHub for Absolute Beginners — Cyber Academy",
  description: "Learn Git and GitHub from scratch in the most immersive, fun, and visually stunning way possible. Real Git in your browser, 20-question quiz, certificate, and more.",
  keywords: ["git", "github", "learn git", "beginners", "tutorial", "interactive"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
