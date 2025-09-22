import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketUp - Event Booking Made Simple",
  description: "The easiest way to book and manage experiences. Streamlined booking, payments, and check-ins for activity businesses.",
  keywords: "event booking, activity booking, experience booking, ticket management, business booking system",
  authors: [{ name: "TicketUp" }],
  creator: "TicketUp",
  openGraph: {
    title: "TicketUp - Event Booking Made Simple",
    description: "The easiest way to book and manage experiences. Streamlined booking, payments, and check-ins for activity businesses.",
    siteName: "TicketUp",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TicketUp - Event Booking Made Simple",
    description: "The easiest way to book and manage experiences. Streamlined booking, payments, and check-ins for activity businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
