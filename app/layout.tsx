import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { GoogleOAuthProvider } from "@react-oauth/google"

import { Roboto, Open_Sans } from "next/font/google"

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-open-sans",
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  title: "CuentIA - Inteligencia fiscal para todos",
  description: "La capa de inteligencia que tus sistemas fiscales necesitaban.",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${openSans.variable}`}>
      <body>
        <Toaster richColors position="top-right" />

        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
