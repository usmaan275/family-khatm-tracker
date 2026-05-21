import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {

  title: {
    default: "Jomshed Miah Family Khatm Tracker 🐐",
    template: "%s | Family Khatm Tracker",
  },

  description:
    "Track Quran khatms and dhikr goals together as a family.",

  applicationName: "Family Khatm Tracker",

  keywords: [
    "Quran",
    "Dhikr",
    "Khatm",
    "Islam",
    "Family",
    "Tracker",
  ],

  authors: [
    {
      name: "Jomshed Miah Family",
    },
  ],

  creator: "Jomshed Miah Family",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },

  openGraph: {
    title: "Jomshed Miah Family Khatm Tracker 🐐",

    description:
      "Track Quran khatms and dhikr goals together as a family.",

    siteName: "Family Khatm Tracker",

    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Family Khatm Tracker",
      },
    ],

    type: "website",
  },

  twitter: {
    card: "summary",

    title: "Jomshed Miah Family Khatm Tracker 🐐",

    description:
      "Track Quran khatms and dhikr goals together as a family.",

    images: ["/icon.png"],
  },

  themeColor: "#070B14",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >

      <body className="bg-[#070B14] text-white min-h-screen">
        {children}
      </body>

    </html>
  )
}