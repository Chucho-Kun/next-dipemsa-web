import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast"
import Script from "next/script";


const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: false
});

export const metadata: Metadata = {
  title: "Dipemsa | Bienvenidos",
  description: "Somos DIPEMSA una empresa de construcción ligera distribuidora de materiales de construcción ligera, contamos con las mejores marcas y stock siempre en existencia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${jost.variable} h-full bg-white antialiased`}
    >
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            <!-- Google Tag Manager -->
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-M4B5NXB');</script>
            <!-- End Google Tag Manager -->
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-jost">

          {/* Google Tag Manager (noscript) */}
          <noscript>
            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M4B5NXB" height="0" width="0" style={{ display: "none", visibility: "hidden" }}></iframe>
          </noscript>

        {children}
        <Toaster
          position="top-center"
        />
        </body>
    </html>
  );
}
