import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display, Merriweather, Work_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/blocks/cart-context'

import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600']
});

const playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700']
});

const merriweather = Merriweather({ 
  subsets: ["latin"],
  variable: '--font-merriweather',
  weight: ['400', '500', '600', '700']
});

const workSans = Work_Sans({ 
  subsets: ["latin"],
  variable: '--font-work-sans',
  weight: ['300', '400', '500', '600']
});



export const metadata: Metadata = {
  title: 'blocks — Natural Skincare',
  description: 'Premium natural skincare and body care products. Glow gently with blocks.',
  generator: 'v0.app',
  keywords: ['skincare', 'natural', 'organic', 'beauty', 'body care', 'cruelty-free'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#F7F4EF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfairDisplay.variable} ${merriweather.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}

// app/layout.tsx
// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//       <head>
//         <script
//           async
//           crossOrigin="anonymous"
//           src="https://tweakcn.com/live-preview.min.js"
//         />
//       </head>
//       <body className={`${dmSans.variable} ${playfairDisplay.variable} ${merriweather.variable} font-sans antialiased`}>
//         <CartProvider>
//           {children}
//         </CartProvider>
//         <Analytics />
//       </body>
//     </html>
//   )
// }
